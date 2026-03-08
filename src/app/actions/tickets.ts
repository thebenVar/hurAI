"use server";

import { prisma } from "@/lib/prisma";
import { TicketData } from "@/components/TicketDashboard";
import { auth } from "@/lib/auth";

export async function createTicket(data: TicketData, departmentId?: string) {
    const session = await auth();
    try {
        // Get the current highest ticket number
        const lastTicket = await prisma.ticket.findFirst({
            orderBy: { ticketNumber: 'desc' },
            select: { ticketNumber: true }
        });
        const nextNumber = (lastTicket?.ticketNumber || 0) + 1;

        const ticket = await prisma.ticket.create({
            data: {
                contact: data.contact,
                source: data.source,
                duration: data.duration,
                topic: data.topic,
                sentiment: data.sentiment,
                priority: data.priority,
                summary: data.summary,
                keyIssues: JSON.stringify(data.keyIssues),
                potentialCauses: JSON.stringify(data.potentialCauses),
                assignee: data.assignee,
                status: data.status,
                category: data.category,
                timeSpent: data.timeSpent,
                ticketNumber: nextNumber,

                // AI Fields
                subCategory: data.subCategory,
                isUserSolvable: data.isUserSolvable,
                userSolvableReason: data.userSolvableReason,
                followUpQuestions: JSON.stringify(data.followUpQuestions),

                // Relational
                departmentId: departmentId || null,
                creatorId: session?.user?.id || null,

                actionPoints: {
                    create: data.actionPoints.map(ap => ({
                        text: ap.text,
                        completed: ap.completed,
                        isNextAction: ap.isNextAction || false
                    }))
                },
                activityLog: {
                    create: {
                        type: "log",
                        author: session?.user?.name || "System",
                        userId: session?.user?.id || null,
                        content: "Ticket created"
                    }
                }
            }
        });

        return { success: true, ticketId: ticket.id, ticketNumber: nextNumber };
    } catch (error) {
        console.error("Failed to create ticket:", error);
        return { success: false, error: "Failed to create ticket" };
    }
}

export async function getTicket(id: string): Promise<TicketData | null> {
    const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
            actionPoints: true,
            activityLog: {
                orderBy: { timestamp: 'desc' }
            },
            department: { select: { id: true, name: true } }
        }
    });

    if (!ticket) return null;

    return {
        id: ticket.id,
        contact: ticket.contact,
        source: ticket.source as any,
        duration: ticket.duration,
        topic: ticket.topic,
        sentiment: ticket.sentiment as any,
        priority: ticket.priority as any,
        summary: ticket.summary,
        aiSummary: (ticket as any).aiSummary || undefined,
        keyIssues: JSON.parse(ticket.keyIssues),
        potentialCauses: JSON.parse(ticket.potentialCauses),

        subCategory: ticket.subCategory || undefined,
        isUserSolvable: ticket.isUserSolvable ?? undefined,
        userSolvableReason: ticket.userSolvableReason || undefined,
        followUpQuestions: ticket.followUpQuestions ? JSON.parse(ticket.followUpQuestions) : [],

        assignee: ticket.assignee || "",
        status: ticket.status as any,
        category: ticket.category as any,
        timeSpent: ticket.timeSpent,

        actionPoints: ticket.actionPoints.map((ap: any) => ({
            id: ap.id,
            text: ap.text,
            completed: ap.completed,
            isNextAction: ap.isNextAction
        })),
        activityLog: ticket.activityLog.map((al: any) => ({
            id: al.id,
            type: al.type as any,
            author: al.author,
            timestamp: al.timestamp.toISOString(),
            content: al.content
        })),
        kbMatches: [],
        ticketNumber: ticket.ticketNumber || undefined
    };
}

/**
 * Fetch tickets scoped to the current user's role:
 * - super_admin/admin: all tickets (or filtered by dept if desired)
 * - user: only tickets in their departments
 * - guest: only tickets they created
 */
export async function getAllTickets(options?: { unassignedOnly?: boolean; limit?: number; includeDeleted?: boolean }) {
    const session = await auth();
    const role = session?.user?.role || "guest";
    const userId = session?.user?.id;
    const limit = options?.limit ?? 50;

    try {
        let where: any = {};

        if (options?.unassignedOnly) {
            // Super admin unassigned queue
            where = { departmentId: null };
            if (!options?.includeDeleted) where.status = { not: "deleted" };
        } else if (role === "super_admin" || role === "admin") {
            // See everything
            if (!options?.includeDeleted) where.status = { not: "deleted" };
        } else if (role === "user") {
            // Scoped to their departments
            const userDepts = await prisma.userDepartment.findMany({
                where: { userId },
                select: { departmentId: true }
            });
            const deptIds = userDepts.map(d => d.departmentId);
            where = { departmentId: { in: deptIds } };
            if (!options?.includeDeleted) where.status = { not: "deleted" };
        } else {
            // Guest: only their own tickets
            where = { creatorId: userId };
            if (!options?.includeDeleted) where.status = { not: "deleted" };
        }

        const tickets = await prisma.ticket.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                department: { select: { id: true, name: true } }
            }
        });

        return tickets.map((ticket: any) => ({
            id: ticket.id,
            ticketNumber: ticket.ticketNumber,
            contact: ticket.contact,
            source: ticket.source,
            topic: ticket.topic,
            priority: ticket.priority,
            status: ticket.status,
            timeSpent: ticket.timeSpent,
            createdAt: ticket.createdAt.toISOString(),
            summary: ticket.summary,
            category: ticket.category,
            assignee: ticket.assignee,
            departmentId: ticket.departmentId,
            departmentName: ticket.department?.name ?? null,
        }));
    } catch (error) {
        console.error("Failed to fetch tickets:", error);
        return [];
    }
}

export async function getDashboardStats() {
    const session = await auth();
    const role = session?.user?.role || "guest";
    const userId = session?.user?.id;

    try {
        let where: any = {};

        if (role === "user") {
            const userDepts = await prisma.userDepartment.findMany({
                where: { userId },
                select: { departmentId: true }
            });
            const deptIds = userDepts.map(d => d.departmentId);
            where = { departmentId: { in: deptIds }, status: { not: "deleted" } };
        } else if (role === "guest") {
            where = { creatorId: userId, status: { not: "deleted" } };
        } else {
            where = { status: { not: "deleted" } };
        }

        const totalTickets = await prisma.ticket.count({ where });
        const pendingActions = await prisma.actionPoint.count({
            where: { completed: false, ticket: where }
        });

        return {
            totalTickets,
            avgResolution: "--",
            customerSatisfaction: "--",
            pendingActions
        };
    } catch (error) {
        console.error("Failed to fetch stats:", error);
        return { totalTickets: 0, avgResolution: "--", customerSatisfaction: "--", pendingActions: 0 };
    }
}

/**
 * Assign a ticket to a department (super_admin only)
 */
export async function assignTicketToDepartment(ticketId: string, departmentId: string | null) {
    const session = await auth();
    if (session?.user?.role !== "super_admin") {
        return { success: false, error: "Unauthorized" };
    }
    try {
        await prisma.ticket.update({
            where: { id: ticketId },
            data: { departmentId }
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to assign ticket:", error);
        return { success: false, error: "Failed to assign ticket" };
    }
}

/**
 * Add an activity log entry to a ticket
 */
export async function addActivityLog(ticketId: string, type: string, content: string, metadata?: any) {
    const session = await auth();
    try {
        const activity = await prisma.activityLog.create({
            data: {
                ticketId,
                type,
                content,
                author: session?.user?.name || "System",
                userId: session?.user?.id || null,
                metadata: metadata ? JSON.stringify(metadata) : null
            }
        });

        // Slack Bi-directional sync
        if (type === "message" || type === "reply" || type === "note") {
            const inboxMsg = await prisma.inboxMessage.findUnique({
                where: { ticketId },
                include: { instance: { include: { plugin: true } } }
            });

            if (inboxMsg && inboxMsg.instance.plugin.name.toLowerCase() === "slack" && inboxMsg.externalId) {
                try {
                    const slackConfig = JSON.parse(inboxMsg.instance.config);
                    // externalId format is channelId|thread_ts
                    const parts = inboxMsg.externalId.split('|');

                    if (parts.length === 2 && slackConfig.bot_token) {
                        const [channel, thread_ts] = parts;
                        const slackRes = await fetch("https://slack.com/api/chat.postMessage", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${slackConfig.bot_token}`
                            },
                            body: JSON.stringify({
                                channel,
                                thread_ts,
                                text: `*Reply from ${activity.author}:*\n${content}`
                            })
                        });

                        const slackData = await slackRes.json();
                        if (!slackData.ok) {
                            console.error("Slack postMessage error:", slackData.error);
                        }
                    }
                } catch (slackErr) {
                    console.error("Failed to sync reply to Slack:", slackErr);
                }
            }
        }

        return { success: true, activity };
    } catch (error) {
        console.error("Failed to add activity log:", error);
        return { success: false, error: "Failed to log activity" };
    }
}

/**
 * Escalate a ticket
 */
export async function escalateTicket(ticketId: string, reason: string) {
    const session = await auth();
    try {
        await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                isEscalated: true,
                escalationReason: reason,
                priority: "high" // auto-bump priority
            }
        });

        // Add to log
        await prisma.activityLog.create({
            data: {
                ticketId,
                type: "status_change",
                content: `Ticket escalated: ${reason}`,
                author: session?.user?.name || "System",
                userId: session?.user?.id || null,
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to escalate ticket:", error);
        return { success: false, error: "Failed to escalate ticket" };
    }
}

/**
 * Update satisfaction score
 */
export async function updateSatisfaction(ticketId: string, score: number) {
    const session = await auth();
    try {
        await prisma.ticket.update({
            where: { id: ticketId },
            data: { satisfactionScore: score }
        });

        await prisma.activityLog.create({
            data: {
                ticketId,
                type: "log",
                content: `User indicated satisfaction score: ${score}/5`,
                author: session?.user?.name || "System",
                userId: session?.user?.id || null,
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to update satisfaction:", error);
        return { success: false, error: "Failed to update satisfaction" };
    }
}

/**
 * Toggle Action Point completion status
 */
export async function toggleActionPoint(actionId: string, completed: boolean) {
    const session = await auth();
    try {
        await prisma.actionPoint.update({
            where: { id: actionId },
            data: { completed }
        });

        // We could also log this to activityLog if we want, 
        // but the UI logs it optimistically already

        return { success: true };
    } catch (error) {
        console.error("Failed to toggle action point:", error);
        return { success: false, error: "Failed to toggle action point" };
    }
}

/**
 * Update AI-generated fields on a ticket after LLM analysis
 */
export async function updateTicketAiFields(ticketId: string, aiData: {
    aiSummary?: string;
    summary?: string;
    category?: string;
    subCategory?: string;
    priority?: string;
    sentiment?: string;
    isUserSolvable?: boolean;
    userSolvableReason?: string;
    followUpQuestions?: string[];
    suggestedActions?: string[];
    keyIssues?: string[];
    potentialCauses?: string[];
}) {
    try {
        // Clear existing AI-generated action points and replace
        await prisma.actionPoint.deleteMany({ where: { ticketId } });

        await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                ...(aiData.aiSummary && { aiSummary: aiData.aiSummary }),
                ...(aiData.summary && { summary: aiData.summary }),
                ...(aiData.category && { category: aiData.category }),
                ...(aiData.subCategory && { subCategory: aiData.subCategory }),
                ...(aiData.priority && { priority: aiData.priority }),
                ...(aiData.sentiment && { sentiment: aiData.sentiment }),
                ...(aiData.isUserSolvable !== undefined && { isUserSolvable: aiData.isUserSolvable }),
                ...(aiData.userSolvableReason && { userSolvableReason: aiData.userSolvableReason }),
                ...(aiData.followUpQuestions && { followUpQuestions: JSON.stringify(aiData.followUpQuestions) }),
                ...(aiData.keyIssues && { keyIssues: JSON.stringify(aiData.keyIssues) }),
                ...(aiData.potentialCauses && { potentialCauses: JSON.stringify(aiData.potentialCauses) }),
                ...(aiData.suggestedActions && aiData.suggestedActions.length > 0 && {
                    actionPoints: {
                        create: aiData.suggestedActions.map(text => ({
                            text,
                            completed: false,
                            isNextAction: false
                        }))
                    }
                })
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to update AI fields:", error);
        return { success: false, error: "Failed to update AI fields" };
    }
}

/**
 * Soft delete a ticket
 */
export async function softDeleteTicket(ticketId: string) {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "super_admin") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await prisma.ticket.update({
            where: { id: ticketId },
            data: { status: "deleted" }
        });

        await prisma.activityLog.create({
            data: {
                ticketId,
                type: "status_change",
                content: "Ticket soft-deleted by admin",
                author: session?.user?.name || "System",
                userId: session?.user?.id || null,
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to soft delete ticket:", error);
        return { success: false, error: "Failed to delete ticket" };
    }
}

/**
 * Restore a soft-deleted ticket
 */
export async function restoreTicket(ticketId: string) {
    const session = await auth();
    if (session?.user?.role !== "admin" && session?.user?.role !== "super_admin") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await prisma.ticket.update({
            where: { id: ticketId },
            data: { status: "open" } // Default back to open
        });

        await prisma.activityLog.create({
            data: {
                ticketId,
                type: "status_change",
                content: "Ticket restored by admin",
                author: session?.user?.name || "System",
                userId: session?.user?.id || null,
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to restore ticket:", error);
        return { success: false, error: "Failed to restore ticket" };
    }
}
