"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// ── Inbox Messages ──────────────────────────────────────────

export async function getInboxMessages() {
    const messages = await prisma.inboxMessage.findMany({
        where: { isConverted: false },
        include: {
            instance: {
                include: { plugin: true }
            }
        },
        orderBy: { receivedAt: "desc" }
    });

    return messages.map((msg) => ({
        id: msg.id,
        sender: msg.senderName || msg.senderId,
        text: msg.content,
        platform: msg.instance.plugin.name.toLowerCase(),
        timestamp: getRelativeTime(msg.receivedAt),
        avatarColor: getAvatarColor(msg.instance.plugin.name),
        type: "text" as const,
        aiSummary: msg.aiSummary,
        aiUrgency: msg.aiUrgency,
        pluginIcon: msg.instance.plugin.icon,
    }));
}

export async function convertMessageToTicket(messageId: string) {
    const session = await auth();
    const role = session?.user?.role;

    if (role !== "admin" && role !== "super_admin") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const message = await prisma.inboxMessage.findUnique({
            where: { id: messageId },
            include: { instance: { include: { plugin: true } } }
        });

        if (!message) return { success: false, error: "Message not found" };
        if (message.isConverted) return { success: false, error: "Already converted" };

        // Get next ticket number
        const lastTicket = await prisma.ticket.findFirst({
            orderBy: { ticketNumber: "desc" },
            select: { ticketNumber: true }
        });
        const nextNumber = (lastTicket?.ticketNumber || 0) + 1;

        // Map plugin name to source
        const sourceMap: Record<string, string> = {
            whatsapp: "whatsapp",
            email: "email",
            slack: "other",
            telegram: "other",
            discord: "other",
        };
        const source = sourceMap[message.instance.plugin.name.toLowerCase()] || "other";

        // Create ticket
        const ticket = await prisma.ticket.create({
            data: {
                contact: message.senderName || message.senderId,
                source,
                duration: "0",
                topic: message.aiSummary || message.content.substring(0, 100),
                sentiment: "neutral",
                priority: message.aiUrgency === "high" ? "high" : message.aiUrgency === "medium" ? "medium" : "low",
                summary: message.content,
                keyIssues: "[]",
                potentialCauses: "[]",
                followUpQuestions: "[]",
                assignee: null,
                status: "open",
                category: "other",
                timeSpent: "0m",
                ticketNumber: nextNumber,
                creatorId: session?.user?.id || null,
                activityLog: {
                    create: {
                        type: "log",
                        author: session?.user?.name || "System",
                        userId: session?.user?.id || null,
                        content: `Converted from ${message.instance.plugin.name} message (${message.senderId})`
                    }
                },
                actionPoints: {
                    create: [
                        { text: "Review incoming message context", completed: false, isNextAction: true }
                    ]
                }
            }
        });

        // Mark message as converted
        await prisma.inboxMessage.update({
            where: { id: messageId },
            data: { isConverted: true, ticketId: ticket.id }
        });

        return { success: true, ticketId: ticket.id, ticketNumber: nextNumber };
    } catch (error) {
        console.error("Error converting message to ticket:", error);
        return { success: false, error: "Failed to convert message" };
    }
}

export async function dismissMessage(messageId: string) {
    const session = await auth();
    const role = session?.user?.role;

    if (role !== "admin" && role !== "super_admin") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await prisma.inboxMessage.update({
            where: { id: messageId },
            data: { isConverted: true } // Mark as handled
        });
        return { success: true };
    } catch (error) {
        console.error("Error dismissing message:", error);
        return { success: false, error: "Failed to dismiss message" };
    }
}

// ── Integration Plugins ─────────────────────────────────────

export async function getPlugins() {
    return prisma.integrationPlugin.findMany({
        include: {
            instances: {
                select: { id: true, name: true, isActive: true }
            }
        },
        orderBy: { name: "asc" }
    });
}

export async function getPluginInstances() {
    return prisma.integrationInstance.findMany({
        where: { isActive: true },
        include: { plugin: true },
        orderBy: { createdAt: "desc" }
    });
}

// ── Helpers ─────────────────────────────────────────────────

function getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;

    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;

    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay}d ago`;
}

function getAvatarColor(pluginName: string): string {
    const map: Record<string, string> = {
        whatsapp: "bg-green-100 text-green-700",
        email: "bg-blue-100 text-blue-700",
        slack: "bg-purple-100 text-purple-700",
        telegram: "bg-sky-100 text-sky-700",
        discord: "bg-indigo-100 text-indigo-700",
    };
    return map[pluginName.toLowerCase()] || "bg-slate-100 text-slate-700";
}
