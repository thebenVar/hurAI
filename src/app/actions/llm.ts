"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface TicketDetails {
    summary: string;
    category: "hardware" | "software" | "network" | "access" | "training" | "logistics" | "translation" | "other";
    subCategory: string;
    priority: "low" | "medium" | "high";
    sentiment: "positive" | "neutral" | "negative";
    isUserSolvable: boolean;
    userSolvableReason: string;
    followUpQuestions: string[];
    suggestedActions: string[];
    keyIssues: string[];
    potentialCauses: string[];
}

export async function generateTicketDetails(messageText: string): Promise<TicketDetails | null> {
    if (!process.env.GOOGLE_API_KEY) {
        console.error("GOOGLE_API_KEY is not set");
        return null;
    }

    try {
        const prompt = `
      You are an expert IT Support Specialist. Analyze the following user message and extract structured ticket details.
      
      User Message: "${messageText}"
      
      Return ONLY a JSON object with the following fields:
      - summary: A concise 1-sentence summary of the issue.
      - category: One of [hardware, software, network, access, training, logistics, translation, other].
      - subCategory: A specific 1-2 word classification (e.g., "Printer", "VPN", "Login").
      - priority: [low, medium, high] based on urgency and impact.
      - sentiment: [positive, neutral, negative] based on user tone.
      - isUserSolvable: boolean (true if the user can likely fix it themselves with guidance).
      - userSolvableReason: Brief explanation of why it is or isn't user solvable.
      - followUpQuestions: Array of 2-3 questions the agent should ask to clarify the issue.
      - suggestedActions: Array of 2-3 initial troubleshooting steps based on general IT knowledge.
      - keyIssues: Array of specific problems identified.
      - potentialCauses: Array of 1-2 likely causes.

      Resist the urge to include markdown code blocks. Just return the raw JSON.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown if present
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(cleanText) as TicketDetails;
    } catch (error) {
        console.error("Error generating ticket details:", error);
        return null;
    }
}
