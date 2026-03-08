"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getDecryptedAiKeys } from "./settings";

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
export async function summarizeMessage(messageText: string, preferredModel?: string): Promise<{ summary: string; urgency: string } | null> {
    const keys = await getDecryptedAiKeys();
    const modelName = preferredModel || keys.defaultModel;

    const prompt = `
      You are an expert IT Support Specialist. Analyze the following user message to determine its intent and urgency.
      
      User Message: "${messageText}"
      
      Return ONLY a JSON object with the following fields:
      - summary: A concise 1-sentence summary of the user's issue or request. Maximum 10 words.
      - urgency: [low, medium, high] based on urgency and impact.

      Resist the urge to include markdown code blocks (e.g., \`\`\`json). Just return the raw JSON text. No newlines outside JSON.
    `;

    try {
        let rawResponse = "";

        if (modelName.toLowerCase().includes("gemini")) {
            if (!keys.geminiKey) throw new Error("Google API Key not configured in settings.");
            const genAI = new GoogleGenerativeAI(keys.geminiKey);
            const geminiModel = genAI.getGenerativeModel({
                model: modelName.toLowerCase().includes("pro") ? "gemini-1.5-pro" : "gemini-1.5-flash"
            });
            const result = await geminiModel.generateContent(prompt);
            rawResponse = result.response.text();
        } else if (modelName.toLowerCase().includes("gpt")) {
            if (!keys.openAiKey) throw new Error("OpenAI API Key not configured in settings.");
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${keys.openAiKey}`
                },
                body: JSON.stringify({
                    model: modelName.toLowerCase().includes("4o") ? "gpt-4o" : "gpt-3.5-turbo",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.1
                })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            rawResponse = data.choices[0].message.content;
        } else if (modelName.toLowerCase().includes("claude")) {
            if (!keys.anthropicKey) throw new Error("Anthropic API Key not configured in settings.");
            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": keys.anthropicKey,
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                    model: "claude-3-5-sonnet-20240620",
                    max_tokens: 1024,
                    messages: [{ role: "user", content: prompt }]
                })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            rawResponse = data.content[0].text;
        } else {
            throw new Error(`Unsupported model provider: ${modelName}`);
        }

        const cleanText = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanText) as { summary: string; urgency: string };
    } catch (error: any) {
        console.error("Error summarizing message:", error);
        return null;
    }
}

export async function generateTicketDetails(messageText: string, preferredModel?: string): Promise<TicketDetails | null> {
    const keys = await getDecryptedAiKeys();
    const modelName = preferredModel || keys.defaultModel;

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

    try {
        let rawResponse = "";

        if (modelName.toLowerCase().includes("gemini")) {
            if (!keys.geminiKey) throw new Error("Google API Key not configured in settings.");
            const genAI = new GoogleGenerativeAI(keys.geminiKey);
            const geminiModel = genAI.getGenerativeModel({
                model: modelName.toLowerCase().includes("pro") ? "gemini-1.5-pro" : "gemini-1.5-flash"
            });
            const result = await geminiModel.generateContent(prompt);
            rawResponse = result.response.text();
        } else if (modelName.toLowerCase().includes("gpt")) {
            if (!keys.openAiKey) throw new Error("OpenAI API Key not configured in settings.");
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${keys.openAiKey}`
                },
                body: JSON.stringify({
                    model: modelName.toLowerCase().includes("4o") ? "gpt-4o" : "gpt-3.5-turbo",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.1
                })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            rawResponse = data.choices[0].message.content;
        } else if (modelName.toLowerCase().includes("claude")) {
            if (!keys.anthropicKey) throw new Error("Anthropic API Key not configured in settings.");
            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": keys.anthropicKey,
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                    model: "claude-3-5-sonnet-20240620",
                    max_tokens: 1024,
                    messages: [{ role: "user", content: prompt }]
                })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            rawResponse = data.content[0].text;
        } else {
            throw new Error(`Unsupported model provider: ${modelName}`);
        }

        const cleanText = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleanText) as TicketDetails;
    } catch (error: any) {
        console.error("Error generating ticket details:", error);
        throw error; // Rethrow so the UI can show the specific error (e.g. key missing)
    }
}
