
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from contextlib import asynccontextmanager
import easyocr
import logging
from pathlib import Path
import re
import json


from backend.ai_analysis import get_health_suggestions  # uses LLaMA3 for summarization


UPLOAD_DIR = Path("temp_uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".pdf", ".tiff", ".bmp"}

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SummarizeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=50000, description="Text to summarize or analyze")

class TextResponse(BaseModel):
    extracted_text: str

class SummaryResponse(BaseModel):
    summary_points: list[str]
    suggestions: list[str]



def validate_file(filename: str, file_size: int | None = None):
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed: images or PDF")
    if file_size and file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (>10MB).")

def clean_text(text: str) -> str:
    """Remove unwanted symbols and normalize spaces."""
    text = re.sub(r"[^A-Za-z0-9\s.,;:!?\-\'\"/()]", " ", text)
    return re.sub(r"\s+", " ", text).strip()

def save_upload_file(upload_file: UploadFile) -> Path:
    """Save uploaded file temporarily."""
    file_path = UPLOAD_DIR / upload_file.filename
    with open(file_path, "wb") as f:
        f.write(upload_file.file.read())
    return file_path

def cleanup_temp_files():
    """Clean temp upload directory on shutdown."""
    for f in UPLOAD_DIR.glob("*"):
        try:
            f.unlink()
        except Exception as e:
            logger.error(f"Error cleaning temp file {f}: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing EasyOCR reader...")
    app.state.reader = easyocr.Reader(["en"], gpu=False)
    logger.info("OCR model loaded ✅")
    yield
    cleanup_temp_files()


app = FastAPI(
    title="Medical Report Text Extractor + Summarizer",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Routes
# -----------------------------
@app.get("/", tags=["Health"])
def home():
    return {"message": "🚀 Medical Report Text Extractor + LLaMA3 Summarizer is running"}

# OCR Extraction
@app.post("/extract_text/", response_model=TextResponse, tags=["OCR"])
async def extract_text(file: UploadFile = File(...)):
    """Extract text from uploaded medical report image."""
    validate_file(file.filename)
    file_path = save_upload_file(file)

    try:
        logger.info(f"Running OCR on file: {file.filename}")
        result = app.state.reader.readtext(str(file_path), detail=0)
        extracted_text = "\n".join(result) if result else "No text found."
        extracted_text = clean_text(extracted_text)
        return TextResponse(extracted_text=extracted_text)
    except Exception as e:
        logger.error(f"OCR failed: {e}")
        raise HTTPException(status_code=500, detail=f"OCR failed: {e}")
    finally:
        if file_path.exists():
            file_path.unlink()

# Summarization
@app.post("/summarize/", response_model=SummaryResponse)
async def summarize_text(data: SummarizeRequest):
    """
    Summarize extracted medical text into bullet points and general health suggestions.
    """
    prompt = f"""
You are a medically knowledgeable AI assistant analyzing a patient's health report text.

Your job:
1. Identify and list all measurable test results (with their units and reference ranges if possible).
2. For each parameter, indicate whether it appears *Normal*, *High*, *Low*, or *Unclear*.
3. Provide concise, safe, and general **health or lifestyle suggestions** — such as diet, exercise, hydration, 
   or follow-up recommendations — **without diagnosing diseases**.

Guidelines:
- If the report appears normal, say so clearly.
- If uncertain, use terms like “possibly elevated” or “slightly low”.
- Return **strict JSON** in this exact format:

{{
  "summary_points": [
    "Hemoglobin: 13.5 g/dL — Normal",
    "Glucose: 165 mg/dL — High (possible hyperglycemia)"
  ],
  "suggestions": [
    "Stay hydrated and maintain a balanced diet.",
    "Limit sugary foods and increase physical activity."
  ]
}}

Now analyze the following text and return **only the JSON**:

{data.text}
"""

    try:
        # Call your LLM function
        result = await get_health_suggestions(prompt)

        # Clean up unwanted markdown or backticks
        clean = re.sub(r"```(json)?|```", "", result, flags=re.IGNORECASE).strip()
        clean = re.sub(r"[\u0000-\u001f]+", "", clean).strip()  # remove control chars

        # Attempt JSON parsing
        parsed = json.loads(clean)

        # Normalize potential key variations
        summary_points = (
            parsed.get("summary_points")
            or parsed.get("summary")
            or parsed.get("points")
            or []
        )
        suggestions = parsed.get("suggestions") or []

        # Ensure correct types
        if not isinstance(summary_points, list):
            summary_points = [str(summary_points)]
        if not isinstance(suggestions, list):
            suggestions = [str(suggestions)]

        return {"summary_points": summary_points, "suggestions": suggestions}

    except Exception as e:
        logger.error(f"Summarization failed: {e} | Raw output: {locals().get('result', '')}")
        return SummaryResponse(
            summary_points=["⚠️ Unable to parse summary properly."],
            suggestions=["Try re-uploading the report or refining the text."]
        )