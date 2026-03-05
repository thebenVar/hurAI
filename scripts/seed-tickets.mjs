import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding sample tickets...');

    // Get a user and department for relations
    const user = await prisma.user.findFirst();
    const dept = await prisma.department.findFirst();

    const ticketsData = [
        {
            topic: "Printer connectivity issue in HR",
            summary: "The main printer on the 3rd floor is showing an orange light and users can't connect to it. Restarting didn't help.",
            contact: "Jane Doe",
            source: "webform",
            priority: "high",
            sentiment: "negative",
            status: "open",
            category: "hardware"
        },
        {
            topic: "Feedback on the new office chairs",
            summary: "The new chairs are very comfortable. Everyone in the Finance team loves them!",
            contact: "John Smith",
            source: "email",
            priority: "low",
            sentiment: "positive",
            status: "resolved",
            category: "office_supplies"
        },
        {
            topic: "VPN access requested for remote work",
            summary: "I'll be working remotely next week and need VPN access configured for my laptop.",
            contact: "Alice Wong",
            source: "slack",
            priority: "medium",
            sentiment: "neutral",
            status: "in-progress",
            category: "access"
        },
        {
            topic: "Network latency during peak hours",
            summary: "The internet is very slow between 2 PM and 4 PM every day. It's affecting our productivity.",
            contact: "Bob Miller",
            source: "webform",
            priority: "medium",
            sentiment: "negative",
            status: "open",
            category: "network"
        }
    ];

    for (const data of ticketsData) {
        // Get next ticket number
        const lastTicket = await prisma.ticket.findFirst({
            orderBy: { ticketNumber: 'desc' },
            select: { ticketNumber: true }
        });
        const nextNumber = (lastTicket?.ticketNumber || 0) + 1;

        const ticket = await prisma.ticket.create({
            data: {
                ...data,
                ticketNumber: nextNumber,
                creatorId: user?.id || null,
                departmentId: dept?.id || null,
                duration: "0",
                timeSpent: "0m",
                keyIssues: "[]",
                potentialCauses: "[]",
                followUpQuestions: "[]",
                activityLog: {
                    create: {
                        type: "log",
                        author: "System",
                        content: "Sample ticket seeded"
                    }
                },
                actionPoints: {
                    create: [
                        { text: "Investigate initial logs", completed: false, isNextAction: true },
                        { text: "Contact user for details", completed: false }
                    ]
                }
            }
        });
        console.log(`Created ticket #TKT-${nextNumber.toString().padStart(3, '0')}: ${ticket.topic}`);
    }

    console.log('Seed completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
