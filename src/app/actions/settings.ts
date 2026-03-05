"use server";

import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export type AiConfiguration = {
    defaultModel: string;
    openAiKey: string;
    anthropicKey: string;
    geminiKey: string;
};

// Mask key for UI display (e.g., "sk-ant-api03-***...***-xYz")
function maskKey(key: string | null): string {
    if (!key) return "";
    if (key.length <= 8) return "***";

    // Show first 8 chars and last 4 chars
    const start = key.substring(0, 8);
    const end = key.substring(key.length - 4);
    return `${start}...***...${end}`;
}

export async function getAiConfiguration(): Promise<AiConfiguration> {
    try {
        const settings = await prisma.systemSettings.findUnique({
            where: { id: "default_settings" }
        });

        if (!settings) {
            return {
                defaultModel: "GPT-4o",
                openAiKey: "",
                anthropicKey: "",
                geminiKey: ""
            };
        }

        // We decrypt to verify and then MASK before sending to the client UI
        const openAi = settings.encryptedOpenAiKey ? decrypt(settings.encryptedOpenAiKey) : "";
        const anthropic = settings.encryptedAnthropicKey ? decrypt(settings.encryptedAnthropicKey) : "";
        const gemini = settings.encryptedGeminiKey ? decrypt(settings.encryptedGeminiKey) : "";

        return {
            defaultModel: settings.defaultModel,
            openAiKey: maskKey(openAi),
            anthropicKey: maskKey(anthropic),
            geminiKey: maskKey(gemini)
        };
    } catch (error) {
        console.error("Failed to fetch AI Configuration:", error);
        throw new Error("Failed to load settings");
    }
}

export async function saveAiConfiguration(data: AiConfiguration) {
    try {
        const session = await auth();
        if (session?.user?.role !== "super_admin") {
            return { success: false, error: "Unauthorized. Super Admin access required." };
        }

        // Fetch existing settings to keep existing keys if the user submits masked values back
        const existing = await prisma.systemSettings.findUnique({
            where: { id: "default_settings" }
        });

        // Determine what to save. If the input contains "...", it's a masked key from the UI,
        // meaning the user didn't change it, so we keep the existing encrypted value in the DB.

        const encryptedOpenAi = data.openAiKey && !data.openAiKey.includes("...")
            ? encrypt(data.openAiKey)
            : existing?.encryptedOpenAiKey || null;

        const encryptedAnthropic = data.anthropicKey && !data.anthropicKey.includes("...")
            ? encrypt(data.anthropicKey)
            : existing?.encryptedAnthropicKey || null;

        const encryptedGemini = data.geminiKey && !data.geminiKey.includes("...")
            ? encrypt(data.geminiKey)
            : existing?.encryptedGeminiKey || null;

        await prisma.systemSettings.upsert({
            where: { id: "default_settings" },
            update: {
                defaultModel: data.defaultModel,
                encryptedOpenAiKey: encryptedOpenAi,
                encryptedAnthropicKey: encryptedAnthropic,
                encryptedGeminiKey: encryptedGemini,
            },
            create: {
                id: "default_settings",
                defaultModel: data.defaultModel,
                encryptedOpenAiKey: encryptedOpenAi,
                encryptedAnthropicKey: encryptedAnthropic,
                encryptedGeminiKey: encryptedGemini,
            }
        });

        revalidatePath("/settings");
        return { success: true };
    } catch (error) {
        console.error("Failed to save AI Configuration:", error);
        return { success: false, error: "Failed to save configuration" };
    }
}

// Internal function to strictly get raw decrypted keys for the LLM gateway.
// This should NEVER be called by a client component.
export async function getDecryptedAiKeys() {
    const settings = await prisma.systemSettings.findUnique({
        where: { id: "default_settings" }
    });

    return {
        defaultModel: settings?.defaultModel || "GPT-4o",
        openAiKey: settings?.encryptedOpenAiKey ? decrypt(settings.encryptedOpenAiKey) : process.env.OPENAI_API_KEY || "",
        anthropicKey: settings?.encryptedAnthropicKey ? decrypt(settings.encryptedAnthropicKey) : process.env.ANTHROPIC_API_KEY || "",
        geminiKey: settings?.encryptedGeminiKey ? decrypt(settings.encryptedGeminiKey) : process.env.GOOGLE_API_KEY || ""
    };
}
