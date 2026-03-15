import React, { useState } from "react";
import axios from "axios";
import { Upload, Loader2, FileText, Brain } from "lucide-react";

export default function App() {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [summaryPoints, setSummaryPoints] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingExtract, setLoadingExtract] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState("");

  const backendURL = "http://127.0.0.1:8000";

  // Handle file upload
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setExtractedText("");
    setSummaryPoints([]);
    setSuggestions([]);
    setError("");
  };

  // Extract text using backend OCR
  const handleExtractText = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setLoadingExtract(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${backendURL}/extract_text/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setExtractedText(res.data.extracted_text);
    } catch (err) {
      setError(err.response?.data?.detail || "Error extracting text.");
    } finally {
      setLoadingExtract(false);
    }
  };

  // Summarize text using backend model
  const handleSummarize = async () => {
    try {
      setLoadingSummary(true);
      const response = await fetch(`${backendURL}/summarize/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText }),
      });

      if (!response.ok) throw new Error("Summarization failed");

      const data = await response.json();
      setSummaryPoints(data.summary_points || []);
      setSuggestions(data.suggestions || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Error generating summary.");
    } finally {
      setLoadingSummary(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 text-gray-800 flex flex-col items-center px-4 py-10">
      <h1 className="text-3xl font-bold text-blue-800 mb-4 flex items-center gap-2">
        <FileText className="h-8 w-8 text-blue-600" />
        Medical Report Analyzer
      </h1>
      <p className="text-gray-600 mb-6">
        Upload your medical report → Extract text → Summarize → Get health insights
      </p>

      <div className="bg-white shadow-xl rounded-3xl p-8 w-full max-w-3xl">
        {/* File Upload Section */}
        <div className="flex flex-col items-center">
          <label
            htmlFor="fileUpload"
            className="flex flex-col items-center justify-center w-full border-2 border-dashed border-blue-400 rounded-2xl p-8 cursor-pointer hover:bg-blue-50 transition"
          >
            <Upload className="h-8 w-8 text-blue-500 mb-2" />
            <p className="text-gray-600">
              {file ? file.name : "Click to upload your medical report (image or PDF)"}
            </p>
            <input
              id="fileUpload"
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          <button
            onClick={handleExtractText}
            disabled={!file || loadingExtract}
            className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            {loadingExtract ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Extracting...
              </>
            ) : (
              <>
                <FileText className="h-5 w-5" /> Extract Text
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 text-red-600 text-center font-medium">{error}</div>
        )}

        {/* Extracted Text Display */}
        {extractedText && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Extracted Text:
            </h2>
            <div className="bg-gray-50 border rounded-xl p-4 text-sm whitespace-pre-wrap leading-relaxed text-gray-700">
              {extractedText}
            </div>
          </div>
        )}

        {/* Summarize Button */}
        {extractedText && (
          <div className="mt-6 text-center">
            <button
              onClick={handleSummarize}
              disabled={loadingSummary}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto disabled:opacity-50"
            >
              {loadingSummary ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Summarizing...
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5" /> Summarize Report
                </>
              )}
            </button>
          </div>
        )}

        {/* 🧠 Summary Section */}
        {summaryPoints.length > 0 && (
          <div className="mt-6 p-5 bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold text-teal-700 mb-3 flex items-center gap-2">
              🧠 Summary
            </h2>
            <ul className="space-y-2 list-disc list-inside text-gray-800">
              {summaryPoints.map((point, idx) => {
                const parts = point.split(/[:\-]/);
                if (parts.length > 1) {
                  return (
                    <li key={idx}>
                      <strong className="text-teal-600">{parts[0].trim()}:</strong>{" "}
                      {parts.slice(1).join(" - ").trim()}
                    </li>
                  );
                } else {
                  return <li key={idx}>{point}</li>;
                }
              })}
            </ul>
          </div>
        )}

        {/* 💡 Suggestions Section */}
        {suggestions.length > 0 && (
          <div className="mt-6 p-5 bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold text-amber-700 mb-3 flex items-center gap-2">
              💡 Suggestions
            </h2>
            <ul className="space-y-2 list-disc list-inside text-gray-800">
              {suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {/* No Summary Placeholder */}
        {summaryPoints.length === 0 &&
          !loadingSummary &&
          extractedText &&
          !error && (
            <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-xl text-gray-700 shadow-sm">
              <p>
                No structured summary available. Please try again for better results.
              </p>
            </div>
          )}
      </div>

      <footer className="mt-8 text-gray-500 text-sm">
        Built with 💙 FastAPI + LLaMA3 + React + Tailwind
      </footer>
    </div>
  );
}
