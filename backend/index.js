require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for frontend
app.use(cors());

// Parse JSON payloads with a limit for large base64 images
app.use(express.json({ limit: "50mb" }));

// Initialize GoogleGenAI SDK
const apiKey = process.env.GEMINI_API_KEY;
let ai;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
} else {
  console.warn("Warning: GEMINI_API_KEY is not defined in environment variables.");
}

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// POST /api/analyze endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const { imageData, mimeType } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: "No image data provided" });
    }

    if (!mimeType) {
      return res.status(400).json({ error: "No mimeType provided" });
    }

    if (!ai) {
      return res.status(500).json({ error: "Gemini AI client is not initialized due to missing GEMINI_API_KEY" });
    }

    // Clean base64 data if it contains the data:image prefix
    let base64Data = imageData;
    if (base64Data.includes(";base64,")) {
      base64Data = base64Data.split(";base64,").pop();
    }

    console.log(`Analyzing image of type ${mimeType}...`);

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: `Analyze this community issue image. Return ONLY JSON with:
{
  "category": "pothole|broken_streetlight|garbage|water_leak|other",
  "severity": "Low|Medium|High",
  "description": "Brief 5-10 word description of the issue"
}`
          }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const resultText = response.text;
    console.log("Gemini API raw response:", resultText);

    let jsonResult;
    try {
      jsonResult = JSON.parse(resultText.trim());
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", resultText);
      // Fallback parser in case Gemini returns markdown block
      const cleanText = resultText.replace(/```json|```/g, "").trim();
      jsonResult = JSON.parse(cleanText);
    }

    res.json(jsonResult);
  } catch (error) {
    console.error("Error during image analysis:", error);
    res.status(500).json({
      error: "Failed to analyze image",
      details: error.message || error
    });
  }
});

// Start backend server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend server running on port ${PORT}`);
});
