# ai_analysis.py
import aiohttp

OLLAMA_URL = "http://localhost:11434/api/generate"

async def get_health_suggestions(prompt: str) -> str:
    """Send the prompt directly to local LLaMA3 model via Ollama."""
    payload = {"model": "llama3", "prompt": prompt, "stream": False}

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(OLLAMA_URL, json=payload) as response:
                if response.status != 200:
                    text = await response.text()
                    raise RuntimeError(f"Ollama API Error: {text}")
                result = await response.json()
                return result.get("response", "").strip()
    except Exception as e:
        return f"⚠️ Error generating summary: {e}"