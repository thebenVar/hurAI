"use server";

import { prisma } from "@/lib/prisma";
import { TicketData } from "@/components/TicketDashboard";
import { redirect } from "next/navigation";

export async function createTicket(data: TicketData) {
    try {
        const ticket = await prisma.ticket.create({
            data: {
                contact: data.contact,
                source: data.source,
                duration: data.duration,
                topic: data.topic,
                sentiment: data.sentiment,
                priority: data.priority,
                summary: data.summary,
                keyIssues: JSON.stringify(data.keyIssues), // Store array as JSON
                potentialCauses: JSON.stringify(data.potentialCauses), // Store array as JSON
                assignee: data.assignee,
                status: data.status,
                category: data.category,
                timeSpent: data.timeSpent,

                // AI Fields
                subCategory: data.subCategory,
                isUserSolvable: data.isUserSolvable,
                userSolvableReason: data.userSolvableReason,
                followUpQuestions: JSON.stringify(data.followUpQuestions),

                // Relations
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
                        author: "System",
                        content: "Ticket created via Smart Ticket Creation"
                    }
                }
            }
        });

        return { success: true, ticketId: ticket.id };
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
            }
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
            timestamp: al.timestamp.toISOString(), // formatting logic can be improved
            content: al.content
        })),
        kbMatches: [] // Mock for now
    };
}

export async function getAllTickets() {
    try {
        const tickets = await prisma.ticket.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10 // Limit for dashboard
        });

        return tickets.map((ticket: any) => ({
            id: ticket.id,
            contact: ticket.contact,
            source: ticket.source as any,
            topic: ticket.topic,
            priority: ticket.priority as any,
            status: ticket.status as any,
            timeSpent: ticket.timeSpent,
            createdAt: ticket.createdAt.toISOString(),
            summary: ticket.summary
        }));
    } catch (error) {
        console.error("Failed to fetch tickets:", error);
        return [];
    }
}

export async function getDashboardStats() {
    try {
        const totalTickets = await prisma.ticket.count();
        const pendingActions = await prisma.actionPoint.count({
            where: { completed: false }
        });

        // Placeholder for complex metrics not yet implemented
        return {
            totalTickets,
            avgResolution: "--",
            customerSatisfaction: "--",
            pendingActions
        };
    } catch (error) {
        console.error("Failed to fetch stats:", error);
        return {
            totalTickets: 0,
            avgResolution: "--",
            customerSatisfaction: "--",
            pendingActions: 0
        };
    }
}
