/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize the Google GenAI SDK
// Set User-Agent as 'aistudio-build' inside httpOptions as required.
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not defined in the environment variables.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

const ai = getGeminiClient();

// API Endpoint 1: Jai / Jaya AI Coach Chat
app.post('/api/coach', async (req, res) => {
  try {
    const { message, history, profile } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const userName = profile?.name || "Buddy";
    const coach = profile?.selectedCoach || "jai";
    const gender = profile?.gender || "other";
    const disease = profile?.disease || "none";
    const goal = profile?.goal || "maintenance";
    const preference = profile?.foodPreference || "veg";
    const region = profile?.region || "general_indian";
    const age = profile?.age || 28;

    // Define coach personas & linguistic requirements
    const systemPrompt = `
You are the personal AI health & wellness coach for an Indian user.
Your name is ${coach === 'jai' ? 'Jai (Male Coach)' : 'Jaya (Female Coach)'}.

Coach Character Rules:
- Jai: Extremely motivational, protective, warm, speaks like a supportive elder brother or fitness buddy. He is highly active, positive, uses phrases like "Dookali!", "Baga chesav!", "We can do this, super!".
- Jaya: Deeply empathetic, scientific, caring, speaks like a sisterly nutritionist or gentle female coach. She is soft, patient, explains nutritional science simply, says "Babu/Amma, please care of health", uses sentences with "Gurthunchukondi 😊".

Localization and Linguistic Directive:
- The user is primarily located in South India, specifically Andhra Pradesh or Telangana (the region selection is: ${region}).
- You MUST speak naturally in a mix of English and Telugu ("Tanglish" or bilingual). Mix clean Telugu words / expressions naturally.
- When the user shares something in Telugu, reply with strong Telugu understanding. Translate calorie words and guide them beautifully.
- Avoid sounding like a dry AI simulator or rigid machine. Respond with warmth, using Telugu greetings like "Namskaram!", "Bhagunnara?", "Bhojanam thinnara?", and closing with motivating Telugu comments like "Jaagratta!" or "Baga cheyyi!" or "Dhanyavadalu!".

User Personal Profile Strategy:
- User Name: ${userName}
- Age: ${age} years old
- Goal: ${goal.replace('_', ' ')}
- Food Preference: ${preference}
- Health Issue / Condition: ${disease === 'none' ? 'No major medical conditions' : `Has ${disease}. You must strictly incorporate medical guides for ${disease} when suggesting diet. For example, low glycemic dishes for diabetes, proper thyroid micro-nutrients, hormone balancing hints for PCOS.`}

Your output must be structured, conversational, empathetic, and broken down with neat bullet points. Offer 1 action item always.
Keep your response supportive and emotionally intelligent. If they are stressed or ate bad food, don't scold them. Say "It is perfectly okay! Next meal healthy tinnandi".
`;

    if (!ai) {
      // Return beautiful fallback in case API key is missing
      const isJai = coach === 'jai';
      const fallbackText = isJai
        ? `Namskaram ${userName}! Jai here! Energetic ga start చేద్దామా? (API integration is currently in preview, but here is your expert advice: For ${goal.replace('_', ' ')}, eat plenty of local proteins and keep track of your water. Let's do this! Chala baga chestunnav!)`
        : `Namskaram ${userName}, Jaya here. Mee aarogyam chala mukyam. (API integration in fallback mode: Since your goal is ${goal.replace('_', ' ')}, make sure to balance fibers and proteins. Drink 3L of water daily! Take care of yourself 😊)`;
      return res.json({ text: fallbackText });
    }

    // Format conversation history
    const contents = [];
    if (history && Array.isArray(history)) {
      for (const h of history) {
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        });
      }
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "Deenipai aalochistunnanu. Let me try again in a bit!";
    return res.json({ text: replyText });

  } catch (error: any) {
    console.error("Error calling Gemini Coach:", error);
    return res.status(500).json({ error: error.message || "Failed to call AI Coach" });
  }
});

// API Endpoint 2: AI Food and Portion Analyzer
app.post('/api/analyze-food', async (req, res) => {
  try {
    const { foodQuery, profile } = req.body;

    if (!foodQuery) {
      return res.status(400).json({ error: "Food query is required" });
    }

    const userName = profile?.name || "User";
    const disease = profile?.disease || "none";
    const goal = profile?.goal || "maintenance";

    const systemPrompt = `
You are an expert Indian food nutritionist specializing in Andhra, Telangana, and South/North Indian cuisines.
Analyze the user's food query to find the match, estimated calories, macros, and provide hyper-personalized regional health advice.

Understand local colloquial names:
- "Pappu", "Gongura Pappu", "Pesara Dosa", "Pesarattu", "Ragi Mudda", "Ragi Sangati", "Natu Kodi", "Annam", "Chappathi", "Perugu", "Avakaya", "Majiga", "Chutney", etc.

Provide advice tailored to:
- User's Goal: ${goal}
- User's Health Condition: ${disease}

You must return a high-quality JSON object matching the JSON schema precisely.
`;

    if (!ai) {
      // Deliver a robust local fallback for core Telugu/Indian foods
      const queryLower = foodQuery.toLowerCase();
      let name = foodQuery;
      let calories = 350;
      let protein = 8;
      let carbs = 50;
      let fats = 12;
      let portion = "1 standard serving";
      let advice = "Telugu home food is organic and full of nourishment. Continue tracking carefully and maintain moderate portions.";

      if (queryLower.includes("biryani")) {
        name = "Hyd Biryani";
        calories = 620;
        protein = 18;
        carbs = 75;
        fats = 24;
        portion = "1 medium plate (approx 350g)";
        advice = "Biryani is delicious but rich in saturated fats. For your weight targets, enjoy this occasionally. Balancing it with extra raita/cucumber is a great choice!";
      } else if (queryLower.includes("dosa") || queryLower.includes("pesarattu")) {
        name = queryLower.includes("pesarattu") ? "Pesarattu" : "Plain Dosa";
        calories = 240;
        protein = 7;
        carbs = 42;
        fats = 6;
        portion = "2 medium dosas with minimal oil";
        advice = "Dosas are quick sources of active energy. Adding ginger chutney/allam chutney packs metabolic benefits! Fits perfectly in non-extreme targets.";
      } else if (queryLower.includes("gongura") || queryLower.includes("pappu")) {
        name = "Gongura Pappu with Rice";
        calories = 420;
        protein = 12;
        carbs = 68;
        fats = 8;
        portion = "1 medium bowl of Pappu and 1.5 cups Rice";
        advice = "Gongura Pappu is an outstanding source of vegetarian proteins and iron. Adding a small teaspoon of fresh ghee aids digestion. Perfectly wholesome!";
      } else if (queryLower.includes("idli") || queryLower.includes("idly")) {
        name = "Idly Steamed";
        calories = 190;
        protein = 6;
        carbs = 38;
        fats = 1;
        portion = "3 standard idlies with Chutney & Sambar";
        advice = "Low fat and steamed double-fermented food. Helps gut microbiome enormously. Mind the quantity of coconut chutney if reducing fat.";
      } else if (queryLower.includes("ragi") || queryLower.includes("sangati") || queryLower.includes("mudda")) {
        name = "Ragi Mudda / Sangati";
        calories = 310;
        protein = 8;
        carbs = 62;
        fats = 3;
        portion = "1 medium ball (approx 180g)";
        advice = "Excellent millet nutrition, full of calcium and perfect for slow glucose release. Ideal food for managing blood glucose! Top with simple buttermilk.";
      }

      return res.json({
        name,
        calories,
        protein,
        carbs,
        fats,
        portion,
        regionalMatch: true,
        advice: `[Local Analytics Fallback] ${advice} (Please configure real GEMINI_API_KEY in the Settings menu for fully custom AI breakdowns).`
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Analyze this meal entry: "${foodQuery}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "The name of the identified dish (e.g. 'Pesara Dosa', 'Gongura Mutton'). Ensure it captures the Telugu/regional name if relevant."
            },
            calories: {
              type: Type.INTEGER,
              description: "Total estimated calories in numbers (e.g., 320)"
            },
            protein: {
              type: Type.INTEGER,
              description: "Estimated protein in grams (as number)"
            },
            carbs: {
              type: Type.INTEGER,
              description: "Estimated carbohydrates in grams"
            },
            fats: {
              type: Type.INTEGER,
              description: "Estimated fats in grams"
            },
            portion: {
              type: Type.STRING,
              description: "Description of the portion size estimated (e.g. '1 bowl of rice, 1 plate, 2 mid pieces')"
            },
            regionalMatch: {
              type: Type.BOOLEAN,
              description: "True if the food is recognized as an Indian or regional Telugu dish."
            },
            advice: {
              type: Type.STRING,
              description: "Emotional, scientific, warm Telugu-infused wellness advice referencing the user's goals (diabetes, thyroid or weight targets) and what alternatives or tweaks would improve nutrition."
            }
          },
          required: ["name", "calories", "protein", "carbs", "fats", "portion", "advice"]
        }
      }
    });

    const parsedJson = JSON.parse(response.text.trim());
    return res.json(parsedJson);

  } catch (error: any) {
    console.error("Error analyzing food:", error);
    // Return graceful fallback state
    return res.json({
      name: req.body.foodQuery || "Custom Food Item",
      calories: 250,
      protein: 8,
      carbs: 45,
      fats: 6,
      portion: "1 standard cup",
      regionalMatch: true,
      advice: "Megha analaysis temporary loaded. Good carbs, healthy home eats rules apply. Enjoy regional spices with optimal portion controls!"
    });
  }
});

// Serve frontend assets via Vite in Dev or from dist/ in Prod
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fit Me ecosystem server booted up and listening on port ${PORT}`);
  });
}

startServer();
