import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding integration plugins and sample messages...');

    // ── Create Plugins ──────────────────────────────────────
    const whatsapp = await prisma.integrationPlugin.upsert({
        where: { id: 'plugin-whatsapp' },
        update: {},
        create: {
            id: 'plugin-whatsapp',
            name: 'WhatsApp',
            description: 'Receive support messages via WhatsApp Business API',
            icon: 'MessageCircle',
            configSchema: JSON.stringify([
                { key: 'phone_number_id', label: 'Phone Number ID', type: 'text' },
                { key: 'access_token', label: 'Access Token', type: 'password' },
                { key: 'webhook_verify_token', label: 'Webhook Verify Token', type: 'password' }
            ]),
            status: 'stable'
        }
    });

    const email = await prisma.integrationPlugin.upsert({
        where: { id: 'plugin-email' },
        update: {},
        create: {
            id: 'plugin-email',
            name: 'Email',
            description: 'Parse inbound emails via SendGrid or Mailgun',
            icon: 'Mail',
            configSchema: JSON.stringify([
                { key: 'inbound_domain', label: 'Inbound Domain', type: 'text' },
                { key: 'webhook_secret', label: 'Webhook Secret', type: 'password' }
            ]),
            status: 'stable'
        }
    });

    const slack = await prisma.integrationPlugin.upsert({
        where: { id: 'plugin-slack' },
        update: {},
        create: {
            id: 'plugin-slack',
            name: 'Slack',
            description: 'Monitor Slack channels for support requests',
            icon: 'Hash',
            configSchema: JSON.stringify([
                { key: 'bot_token', label: 'Bot Token', type: 'password' },
                { key: 'signing_secret', label: 'Signing Secret', type: 'password' },
                { key: 'channel_id', label: 'Channel ID', type: 'text' }
            ]),
            status: 'stable'
        }
    });

    const telegram = await prisma.integrationPlugin.upsert({
        where: { id: 'plugin-telegram' },
        update: {},
        create: {
            id: 'plugin-telegram',
            name: 'Telegram',
            description: 'Receive messages from a Telegram bot',
            icon: 'Send',
            configSchema: JSON.stringify([
                { key: 'bot_token', label: 'Bot Token', type: 'password' }
            ]),
            status: 'community'
        }
    });

    const voiceAi = await prisma.integrationPlugin.upsert({
        where: { id: 'plugin-voice' },
        update: {},
        create: {
            id: 'plugin-voice',
            name: 'Voice',
            description: 'Receive call transcriptions from Voice.ai or Twilio',
            icon: 'Phone',
            configSchema: JSON.stringify([
                { key: 'api_key', label: 'API Key', type: 'password' },
                { key: 'webhook_url', label: 'Webhook URL', type: 'text' }
            ]),
            status: 'beta'
        }
    });

    console.log(`Created ${5} plugins`);

    // ── Create Demo Instances ───────────────────────────────
    const waInstance = await prisma.integrationInstance.upsert({
        where: { id: 'instance-wa-demo' },
        update: {},
        create: {
            id: 'instance-wa-demo',
            pluginId: whatsapp.id,
            name: 'Main WhatsApp Line',
            isActive: true,
            config: JSON.stringify({ phone_number_id: 'demo', access_token: 'demo', webhook_verify_token: 'demo' })
        }
    });

    const emailInstance = await prisma.integrationInstance.upsert({
        where: { id: 'instance-email-demo' },
        update: {},
        create: {
            id: 'instance-email-demo',
            pluginId: email.id,
            name: 'Support Email',
            isActive: true,
            config: JSON.stringify({ inbound_domain: 'support@company.com', webhook_secret: 'demo' })
        }
    });

    const slackInstance = await prisma.integrationInstance.upsert({
        where: { id: 'instance-slack-demo' },
        update: {},
        create: {
            id: 'instance-slack-demo',
            pluginId: slack.id,
            name: 'IT Help Channel',
            isActive: true,
            config: JSON.stringify({ bot_token: 'demo', signing_secret: 'demo', channel_id: '#it-help' })
        }
    });

    console.log('Created 3 demo instances');

    // ── Seed Sample Messages ────────────────────────────────
    const sampleMessages = [
        {
            instanceId: waInstance.id,
            senderId: '+91-9876543210',
            senderName: 'John Doe',
            content: 'Hey, the printer on the 2nd floor is jammed again. Can someone check it?',
            aiSummary: 'Printer jam report — 2nd floor',
            aiUrgency: 'medium',
        },
        {
            instanceId: waInstance.id,
            senderId: '+91-9123456789',
            senderName: 'Priya Singh',
            content: "I'm locked out of my account. Error code 503. I've been trying for an hour and nothing works.",
            aiSummary: 'Account lockout — Error 503',
            aiUrgency: 'high',
        },
        {
            instanceId: emailInstance.id,
            senderId: 'marketing-team@company.com',
            senderName: null,
            content: 'Urgent: The main website is returning 502 errors for all external traffic. Our clients are complaining. Please investigate ASAP.',
            aiSummary: 'Website down — 502 errors for external traffic',
            aiUrgency: 'high',
        },
        {
            instanceId: slackInstance.id,
            senderId: '@david.chen',
            senderName: 'David Chen',
            content: 'Can someone help me set up VPN access? I need it configured before my remote trip next week.',
            aiSummary: 'VPN setup request for remote work',
            aiUrgency: 'low',
        },
        {
            instanceId: emailInstance.id,
            senderId: 'hr@company.com',
            senderName: 'HR Department',
            content: 'We need 5 new laptops provisioned for the incoming batch of interns starting next Monday. Please coordinate with procurement.',
            aiSummary: 'Laptop provisioning — 5 units for new interns',
            aiUrgency: 'medium',
        }
    ];

    for (const msg of sampleMessages) {
        await prisma.inboxMessage.create({ data: msg });
    }

    console.log(`Created ${sampleMessages.length} sample inbox messages`);
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
