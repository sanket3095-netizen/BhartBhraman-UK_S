/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { 
  getExpenses, saveExpense, deleteExpense,
  getHotels, saveHotel, deleteHotel,
  getPackingItems, savePackingItem, deletePackingItem,
  getMemories, saveMemory, loveMemory, deleteMemory
} from "./src/db/postgres.ts";

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

// PostgreSQL database CRUD proxy endpoints for Travel Expenses
app.get("/api/expenses", async (req, res) => {
  try {
    const data = await getExpenses();
    return res.json(data);
  } catch (err: any) {
    console.error("GET /api/expenses error:", err);
    return res.status(500).json({ error: "Failed to fetch expenses from database", details: err.message });
  }
});

app.post("/api/expenses", async (req, res) => {
  try {
    const expense = req.body;
    if (!expense || !expense.id || !expense.title) {
      return res.status(400).json({ error: "Invalid expense data. 'id' and 'title' are required." });
    }
    await saveExpense(expense);
    return res.json({ success: true, message: "Expense saved successfully to database" });
  } catch (err: any) {
    console.error("POST /api/expenses error:", err);
    return res.status(500).json({ error: "Failed to save expense in database", details: err.message });
  }
});

app.delete("/api/expenses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Expense ID is required." });
    }
    await deleteExpense(id);
    return res.json({ success: true, message: "Expense deleted successfully from database" });
  } catch (err: any) {
    console.error("DELETE /api/expenses/:id error:", err);
    return res.status(500).json({ error: "Failed to delete expense from database", details: err.message });
  }
});

// Weather API: real-time fetch from Open-Meteo for the 4 Uttarakhand spots
app.get("/api/weather", async (req, res) => {
  try {
    const spots = [
      { name: "Hanol", lat: 30.95, lon: 77.93 },
      { name: "Chakrata", lat: 30.70, lon: 77.87 },
      { name: "Mussoorie", lat: 30.46, lon: 78.08 },
      { name: "Dehradun", lat: 30.32, lon: 78.03 }
    ];

    const weatherData = await Promise.all(
      spots.map(async (spot) => {
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${spot.lat}&longitude=${spot.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch weather for ${spot.name}`);
          }
          const data = await response.json();
          return {
            name: spot.name,
            temp: data.current?.temperature_2m ?? 20,
            weatherCode: data.current?.weather_code ?? 0,
            humidity: data.current?.relative_humidity_2m ?? 60,
            windSpeed: data.current?.wind_speed_10m ?? 5,
          };
        } catch (e: any) {
          console.error(`Error fetching weather for ${spot.name}:`, e);
          return {
            name: spot.name,
            temp: 20,
            weatherCode: 1,
            humidity: 55,
            windSpeed: 4,
            fallback: true
          };
        }
      })
    );

    return res.json(weatherData);
  } catch (err: any) {
    console.error("GET /api/weather error:", err);
    return res.status(500).json({ error: "Failed to fetch weather data", details: err.message });
  }
});

// PostgreSQL database CRUD proxy endpoints for Hotel Tracker
app.get("/api/hotels", async (req, res) => {
  try {
    const data = await getHotels();
    return res.json(data);
  } catch (err: any) {
    console.error("GET /api/hotels error:", err);
    return res.status(500).json({ error: "Failed to fetch hotels from database", details: err.message });
  }
});

app.post("/api/hotels", async (req, res) => {
  try {
    const hotel = req.body;
    if (!hotel || !hotel.id || !hotel.name) {
      return res.status(400).json({ error: "Invalid hotel data. 'id' and 'name' are required." });
    }
    await saveHotel(hotel);
    return res.json({ success: true, message: "Hotel saved successfully to database" });
  } catch (err: any) {
    console.error("POST /api/hotels error:", err);
    return res.status(500).json({ error: "Failed to save hotel in database", details: err.message });
  }
});

app.delete("/api/hotels/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Hotel ID is required." });
    }
    await deleteHotel(id);
    return res.json({ success: true, message: "Hotel deleted successfully from database" });
  } catch (err: any) {
    console.error("DELETE /api/hotels/:id error:", err);
    return res.status(500).json({ error: "Failed to delete hotel from database", details: err.message });
  }
});

// PostgreSQL database CRUD proxy endpoints for Packing List Checklist
app.get("/api/packing", async (req, res) => {
  try {
    const data = await getPackingItems();
    return res.json(data);
  } catch (err: any) {
    console.error("GET /api/packing error:", err);
    return res.status(500).json({ error: "Failed to fetch packing list from database", details: err.message });
  }
});

app.post("/api/packing", async (req, res) => {
  try {
    const item = req.body;
    if (!item || !item.id || !item.title) {
      return res.status(400).json({ error: "Invalid packing item data. 'id' and 'title' are required." });
    }
    await savePackingItem(item);
    return res.json({ success: true, message: "Packing item saved successfully to database" });
  } catch (err: any) {
    console.error("POST /api/packing error:", err);
    return res.status(500).json({ error: "Failed to save packing item in database", details: err.message });
  }
});

app.delete("/api/packing/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Packing item ID is required." });
    }
    await deletePackingItem(id);
    return res.json({ success: true, message: "Packing item deleted successfully from database" });
  } catch (err: any) {
    console.error("DELETE /api/packing/:id error:", err);
    return res.status(550).json({ error: "Failed to delete packing item from database", details: err.message });
  }
});

// PostgreSQL database CRUD proxy endpoints for Travel Memories & Diaries
app.get("/api/memories", async (req, res) => {
  try {
    const data = await getMemories();
    return res.json(data);
  } catch (err: any) {
    console.error("GET /api/memories error:", err);
    return res.status(500).json({ error: "Failed to fetch memories from database", details: err.message });
  }
});

app.post("/api/memories", async (req, res) => {
  try {
    const memory = req.body;
    if (!memory || !memory.id || !memory.title) {
      return res.status(400).json({ error: "Invalid memory data. 'id' and 'title' are required." });
    }
    await saveMemory(memory);
    return res.json({ success: true, message: "Memory saved successfully to database" });
  } catch (err: any) {
    console.error("POST /api/memories error:", err);
    return res.status(500).json({ error: "Failed to save memory in database", details: err.message });
  }
});

app.post("/api/memories/:id/love", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Memory ID is required." });
    }
    await loveMemory(id);
    return res.json({ success: true, message: "Memory loved successfully in database" });
  } catch (err: any) {
    console.error("POST /api/memories/:id/love error:", err);
    return res.status(500).json({ error: "Failed to love memory in database", details: err.message });
  }
});

app.delete("/api/memories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Memory ID is required." });
    }
    await deleteMemory(id);
    return res.json({ success: true, message: "Memory deleted successfully from database" });
  } catch (err: any) {
    console.error("DELETE /api/memories/:id error:", err);
    return res.status(500).json({ error: "Failed to delete memory from database", details: err.message });
  }
});

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
