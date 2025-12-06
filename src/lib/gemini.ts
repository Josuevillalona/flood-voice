import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY || "");

// Fixed Taxonomy for Aggregation
const VALID_TAGS = [
    "Medical",
    "Food/Water",
    "Power",
    "Evacuation",
    "Mental Health",
    "Property Damage",
    "Safe"
];

// Interface for Structured Output
export interface CallAnalysis {
    tags: string[];
    sentiment_score: number;
    key_topics: string;
}

export async function analyzeTranscript(transcript: string): Promise<CallAnalysis | null> {
    if (!API_KEY) {
        console.error("Gemini API Key missing");
        return null;
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" } // Force JSON
        });

        const prompt = `
      You are an emergency response AI. Analyze this transcript for a liaison dashboard.
      
      TRANSCRIPT:
      "${transcript}"

      RULES:
      1. SCORING (1-10):
         - 1-3: Calm, informational, safe.
         - 4-6: Concerned, anxious, mild needs.
         - 7-8: Distressed, urgent needs, crying.
         - 9-10: Panic, life-threatening, screaming.
      
      2. TAGGING:
         - Select strictly from: ${JSON.stringify(VALID_TAGS)}
         - If uncertain, default to "Safe".
      
      3. KEY TOPICS:
         - Write a 1-sentence summary (max 15 words) focusing on NEEDS.
      
      OUTPUT JSON FORMAT:
      {
        "tags": ["Tag1", "Tag2"],
        "sentiment_score": number, 
        "key_topics": "Summary string here"
      }
    `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Parse JSON safely
        const data = JSON.parse(text) as CallAnalysis;
        return data;

    } catch (error: any) {
        console.error("Gemini Analysis Failed:", error);
        throw new Error(`Gemini Error: ${error.message || error}`);
    }
}
