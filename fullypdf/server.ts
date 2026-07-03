import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini API
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const interaction = await ai.interactions.create({
        model: "gemini-3.5-flash",
        input: message,
      });

      res.json({ response: interaction.output_text });
    } catch (error: any) {
      console.error("Gemini Chat Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate response" });
    }
  });

  // Example Gemini Route
  app.post("/api/gemini/summarize", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const interaction = await ai.interactions.create({
        model: "gemini-3.5-flash",
        system_instruction: "You are an expert document analyst. Please provide a concise, structured summary of the following PDF content. Focus on key takeaways and essential data.",
        input: text,
      });

      res.json({ summary: interaction.output_text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate summary" });
    }
  });

  app.post("/api/gemini/translate", async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;
      if (!text || !targetLanguage) {
        return res.status(400).json({ error: "Text and targetLanguage are required" });
      }

      const interaction = await ai.interactions.create({
        model: "gemini-3.5-flash",
        system_instruction: `You are a professional translator. Translate the following document text into ${targetLanguage}. Maintain the original tone, technical accuracy, and any specific formatting cues.`,
        input: text,
      });

      res.json({ translation: interaction.output_text });
    } catch (error: any) {
      console.error("Gemini Translation Error:", error);
      res.status(500).json({ error: error.message || "Failed to translate text" });
    }
  });

  app.post("/api/gemini/explain", async (req, res) => {
    try {
      const { text, context } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const interaction = await ai.interactions.create({
        model: "gemini-3.5-flash",
        system_instruction: `You are a helpful educational assistant. Explain the following document excerpt in simple, clear terms for a non-expert audience. ${context ? `Context about the document: ${context}` : ""}`,
        input: text,
      });

      res.json({ explanation: interaction.output_text });
    } catch (error: any) {
      console.error("Gemini Explanation Error:", error);
      res.status(500).json({ error: error.message || "Failed to explain text" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
