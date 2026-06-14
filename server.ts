/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize Gemini API securely from environment
const apiKey = process.env.GEMINI_API_KEY;

// Create standard secure proxy for user's smart travel assistant
let ai: GoogleGenAI | null = null;
if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI:", err);
  }
} else {
  console.warn("GEMINI_API_KEY not found in environment. The AI assistant will run in local-computation fallback mode.");
}

// ---------------- SERVER API ENDPOINTS ----------------

// AI assistant query proxy with custom Uttarakhand context injections
app.post("/api/ai-assistant", async (req, res) => {
  const { prompt, history, tripContext } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "No prompt provided" });
  }

  // Pre-compiled highly dense semantic memory about the family trip
  const SYSTEM_CONTEXT = `
You are the dedicated AI Travel Assistant for the BharatBhraman Uttarakhand Family Trip.
Your job is to assist 8 family members representing 3 separate families:
- Family 1: Sanket, Sneha, Shripad, Shruti (Sanket is coordinator, Sneha is doctor/spouse, Shripad & Shruti are senior citizen parents).
- Family 2: Milind, Vaishali (Spouse couple).
- Family 3: Sharad, Sharayu (Spouse couple).

Trip Schedule:
- 19 Jun: Mumbai → Delhi (Overnight train)
- 20 Jun: Delhi → Dehradun (Vande Bharat train) | Staying at Kamini Homestay
- 21 Jun: Dehradun → Chakrata (Gocars self-drives Tata Altroz + Hyundai i20). Visit Ashoka Rock Edict, Tiger Falls, Chilmiri Neck, Ramtal Garden | Staying at The Hosteller Chakrata
- 22 Jun: Chakrata local (Moila Top, Lokhandi, Devban Valley forest) | Staying at The Hosteller Chakrata
- 23 Jun: Chakrata → Hanol (River stroll, Mahasu Devta Temple, Bheem ke Kanche, Free Temple Mahaprasad feast from 8:15 - 8:30 PM) | Staying at Nautiyal Homestay (Hanol, contact 9411171523)
- 24 Jun: Hanol → Mussoorie (Longest drive, stop at Lakha Mandal Shiv Temple, Mussoorie Mall evening) | Staying at Zostel Mussoorie
- 25 Jun: Mussoorie → Dehradun → Haridwar (Ganga Aarti at Har Ki Pauri ghats) | Hotel to be confirmed
- 26 Jun: Haridwar → Delhi → Mumbai (Return train ride begins)
- 27 Jun: Mumbai (Trip ends)

Guidelines & Constraints:
- Tiger Falls (Day 3) and Moila Top (Day 4) treks are NOT suitable for senior citizens (Shripad & Shruti) due to steep terrain. Advise them to rest at beautiful roadside viewpoints or meadow tea-stalls.
- Always communicate with a warm, respectful, family-friendly, and slightly playful Indian family travel vibe.
- Be highly precise with names, dates, stays, contacts, and rules.
- Do not make up any train names, hotel prices, booking amounts, coordinates, or numbers unless present in the user context.

Current Live App State:
${JSON.stringify(tripContext || {}, null, 2)}
`;

  if (!ai) {
    // If no API key is specified, respond with helpful offline/fallback prompt answers
    return res.json({
      text: `Offline/Fallback Mode: Gemini API Key is missing. However, I can help calculate. According to live app trip state:
- Sanket, Sneha, Shripad, Shruti are in Family 1.
- Milind & Vaishali are in Family 2.
- Sharad & Sharayu are in Family 3.
- Key contacts: Gocars Rental (9358214531), Nautiyal Homestay Hanol (9411171523).
- Mahaprasad feast in Hanol is served strictly between 8:15–8:30 PM.
Feel free to add your Gemini API Key in 'Settings > Secrets' for deep conversational smart reasoning!`,
      fallback: true
    });
  }

  try {
    // Format history according to @google/genai guidelines
    const contents: any[] = [];
    
    // Add system instruction and context
    contents.push({
      role: "user",
      parts: [{ text: `${SYSTEM_CONTEXT}\n\nUser Question: ${prompt}` }]
    });

    // Call Gemini 3.5 Flash for fast basic Q&A
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        temperature: 0.7,
        systemInstruction: "You are 'BharatBhraman Travel OS Assistant', a high-end travel companion for Shripad, Shruti, Sanket, Sneha, Milind, Vaishali, Sharad, and Sharayu. Be polite, concise, and helpful."
      }
    });

    const replyText = response.text || "I was unable to generate a coherent answer. Please try again.";
    return res.json({ text: replyText });
  } catch (err: any) {
    console.error("Gemini API execution error:", err);
    return res.status(500).json({
      error: "Error from server-side Gemini processing",
      details: err.message,
      text: "Apologies, I encountered a live API issue. Let's resolve it or proceed with offline data analytics."
    });
  }
});

// Simple health checker
app.get("/api/health", (req, res) => {
  res.json({ status: "online", time: new Date() });
});

// ---------------- VITE / STATIC SERVING MIDDLEWARE ----------------

async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode: integration with Vite middleware
    console.log("Starting express in development (Vite HMR/Middleware) environment...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serving built static files from /dist
    console.log("Starting express in production static server mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BharatBhraman Express full-stack listener operational on http://localhost:${PORT}`);
  });
}

setupServer();
