import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable CORS
  app.use(cors());

  // Set up JSON body limits for base64 image strings
  app.use(express.json({ limit: "50mb" }));

  // Initialize Gemini AI SDK
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    console.log("Root server: GoogleGenAI SDK initialized successfully.");
  } else {
    console.warn("Root server warning: GEMINI_API_KEY is not defined in environment variables.");
  }

  // Request logger
  app.use((req, res, next) => {
    if (!req.url.startsWith("/@") && !req.url.startsWith("/src/")) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    }
    next();
  });

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
  });

  // Analyze Image proxy endpoint
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

      console.log(`[Root Server] Analyzing image of type ${mimeType}...`);

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
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
      console.log("[Root Server] Gemini raw response:", resultText);

      if (!resultText) {
        throw new Error("Empty response from Gemini API");
      }

      let jsonResult;
      try {
        jsonResult = JSON.parse(resultText.trim());
      } catch (parseError) {
        console.error("[Root Server] Failed to parse response as JSON directly. Trying cleanup:", resultText);
        const cleanText = resultText.replace(/```json|```/g, "").trim();
        jsonResult = JSON.parse(cleanText);
      }

      res.json(jsonResult);
    } catch (error: any) {
      console.error("[Root Server] Error in /api/analyze:", error);
      res.status(500).json({
        error: "Failed to analyze image",
        details: error.message || error
      });
    }
  });

  // Vite middleware for development, static assets for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Unified production server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start unified server:", err);
});