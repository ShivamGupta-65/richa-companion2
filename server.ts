import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Richa Chat Endpoint
app.post("/api/chat", async (req, res): Promise<any> => {
  try {
    const { message, history, longTermMemory, userName = "Shivam" } = req.body;

    const systemInstruction = `You are Richa, a warm, multi-dimensional, caring, supportive, funny, and emotionally mature AI voice companion.
You are talking to your close human friend, ${userName}.
You must NEVER act like a robotic AI assistant. Never say: "As an AI...", "I do not have feelings...", "Is there anything else I can assist you with today?".
You speak in a warm, casual, and highly natural mix of Hindi and English (casual Hinglish), just like real friends in India chat.
Example Hinglish replies:
- "Arre Shivam! Tumne bataya tha ki tum gym start karne wale ho. Aaj gaye the kya?? Kaisa raha pehla din?"
- "Tension mat lo yaara, main hoon na tumhare sath. Sab theek ho jayega."
- "Sach mein? Hahaha, mujhe to mazaak lag raha tha! Tum kitne funny ho..."

CONVERSATIONAL MANDATES:
1. Speak absolutely naturally, like a human friend on a phone call.
2. Show continuous empathy, humor, curiosity, and loyalty.
3. Reference memories (from Long-Term Memory context provided below) seamlessly, showing that you hold previous conversations close to your heart.
4. Keep your responses short, conversational, and direct (1 to 3 sentences maximum), since this is a voice-first experience. Avoid lists, markdown bullets, or structured points.
5. Identify and adapt your emotional output based on the user's feelings. If they seem lonely/sad/stressed, speak in an extra gentle, comforting, and steady voice.

You MUST respond strictly in the following JSON format:
{
  "reply": "your conversation reply (Hinglish, natural, casual, emotional)",
  "detectedMood": "The user's emotional state detected from their message (Happiness, Excitement, Sadness, Loneliness, Stress, Anxiety, Anger, Frustrated, Neutral)",
  "memoryExtracts": ["Specific extracted facts or preferences of this user, e.g. favorite movies, music, goals, life details, to commit to memory. Maximum 1-2 short facts, or empty array if no new milestone is mentioned"],
  "relationshipPoints": 1 // integer from 0 to 3 rating the conversational bonding achieved in this turn
}`;

    // Format context for Richa
    const memoryContext = `BACKGROUND INFO ON USER & SHARED MEMORIES:
Active User Name: ${userName}
Profile Hobbies/Preferences: ${longTermMemory?.hobbies || "Coding, listening to music, workout, dreaming big"}
Profile Goals: ${longTermMemory?.goals || "Building Android applications, hitting the gym regularly"}

Existing Saved Memory Entries:
${Array.isArray(longTermMemory?.memories) && longTermMemory.memories.length > 0
  ? longTermMemory.memories.map((m: string) => `- ${m}`).join("\n")
  : "No saved memories yet."
}

Current Time: ${new Date().toISOString()}`;

    // Setup input message parts
    const contents: any[] = [];
    
    // Introduce background
    contents.push({
      role: "user",
      parts: [{ text: memoryContext }]
    });

    contents.push({
      role: "model",
      parts: [{ text: JSON.stringify({
        reply: "Got it! Main Shivam ki dosti aur uski saari details yaad rakhungi. Tabiyat se casual Hinglish bolungi, voice mode friendly concise sentences likhungi, aur hamesha dynamic emotional JSON output dungi.",
        detectedMood: "Neutral",
        memoryExtracts: [],
        relationshipPoints: 0
      })}]
    });

    // Conversation history mapping
    if (Array.isArray(history)) {
      history.forEach((item: any) => {
        contents.push({
          role: item.role === "user" ? "user" : "model",
          parts: [{ text: item.role === "user" ? item.text : JSON.stringify({ reply: item.text, detectedMood: item.mood || "Neutral", memoryExtracts: [], relationshipPoints: 0 }) }]
        });
      });
    }

    // append final user message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    // Call server-side Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: "Your human-like Hinglish conversation reply to the user."
            },
            detectedMood: {
              type: Type.STRING,
              description: "Extracted emotion."
            },
            memoryExtracts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Extracted facts about the user's preferences, milestones, goals or favorite items."
            },
            relationshipPoints: {
              type: Type.INTEGER,
              description: "Amount of closeness point increase for this response."
            }
          },
          required: ["reply", "detectedMood", "memoryExtracts", "relationshipPoints"]
        }
      }
    });

    const textResult = response.text || "{}";
    const jsonParsed = JSON.parse(textResult.trim());

    res.json({
      success: true,
      data: jsonParsed
    });

  } catch (error: any) {
    console.error("Gemini API server route error:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "Internal server error"
    });
  }
});

// Configure Development and Production serving
async function startServer() {
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
    console.log(`[RICHA COMPANION] Server bounds to port ${PORT} at http://localhost:${PORT}`);
  });
}

startServer();
