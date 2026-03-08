import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from 'crypto';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ instanceId: string }> }
) {
    try {
        const { instanceId } = await params;

        // 1. Fetch Integration Instance
        const instance = await prisma.integrationInstance.findUnique({
            where: { id: instanceId, isActive: true },
            include: { plugin: true }
        });

        if (!instance) {
            return NextResponse.json({ error: "Instance not found or inactive" }, { status: 404 });
        }

        const config = JSON.parse(instance.config);
        const payload = await request.clone().text(); // Raw text for signature verification
        const data = await request.json(); // Parsed JSON

        // 2. Normalize based on Plugin Type
        let normalizedInfo = {
            senderId: "",
            senderName: "",
            content: "",
            externalId: null as string | null
        };

        const pluginName = instance.plugin.name.toLowerCase();

        if (pluginName === "whatsapp") {
            // Verify WhatsApp Webhook Signature (X-Hub-Signature-256)
            // Example basic verification:
            // const signature = request.headers.get("x-hub-signature-256");
            // const expectedSig = `sha256=${crypto.createHmac("sha256", config.webhook_verify_token).update(payload).digest("hex")}`;
            // if (signature !== expectedSig) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

            // Normalize WhatsApp Cloud API payload
            if (data.object === "whatsapp_business_account") {
                const messageData = data.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
                const contactData = data.entry?.[0]?.changes?.[0]?.value?.contacts?.[0];

                if (messageData && messageData.type === "text") {
                    normalizedInfo = {
                        senderId: messageData.from,
                        senderName: contactData?.profile?.name || messageData.from,
                        content: messageData.text.body,
                        externalId: messageData.id
                    };
                } else {
                    return NextResponse.json({ success: true, message: "Non-text message processed" });
                }
            } else {
                return NextResponse.json({ success: true, message: "Not a message event" });
            }

        } else if (pluginName === "slack") {
            const slackSignature = request.headers.get("x-slack-signature");
            const slackTimestamp = request.headers.get("x-slack-request-timestamp");

            if (config.signing_secret && slackSignature && slackTimestamp) {
                const timeStr = parseInt(slackTimestamp, 10);
                if (Math.abs(Math.floor(Date.now() / 1000) - timeStr) > 300) {
                    return NextResponse.json({ error: "Request too old" }, { status: 400 });
                }
                const sigBasestring = `v0:${slackTimestamp}:${payload}`;
                const mySignature = "v0=" + crypto.createHmac("sha256", config.signing_secret).update(sigBasestring).digest("hex");

                // Compare carefully to avoid timing attacks
                try {
                    if (!crypto.timingSafeEqual(Buffer.from(mySignature, "utf8"), Buffer.from(slackSignature, "utf8"))) {
                        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
                    }
                } catch (e) {
                    return NextResponse.json({ error: "Invalid signature format" }, { status: 401 });
                }
            }

            // Slack events API
            if (data.type === "url_verification") return NextResponse.json({ challenge: data.challenge });

            if (data.event?.type === "message" && !data.event.bot_id) {
                // A channel message from a user
                const threadIdentifier = data.event.thread_ts || data.event.ts;
                normalizedInfo = {
                    senderId: data.event.user,
                    senderName: data.event.user, // Ideally fetch user info via Slack API
                    content: data.event.text,
                    // externalId format: channelId|thread_ts
                    externalId: `${data.event.channel}|${threadIdentifier}`
                };
            } else {
                return NextResponse.json({ success: true, message: "Ignored slack event" });
            }
        } else if (pluginName === "telegram") {
            // Telegram webhook payload
            if (data.message && data.message.text) {
                normalizedInfo = {
                    senderId: data.message.from.id.toString(),
                    senderName: data.message.from.first_name || data.message.from.username,
                    content: data.message.text,
                    externalId: data.message.message_id.toString()
                };
            } else {
                return NextResponse.json({ success: true, message: "Ignored telegram event" });
            }
        } else if (pluginName === "email") {
            // Example SendGrid Inbound Parse
            normalizedInfo = {
                senderId: data.from,
                senderName: data.fromName || data.from,
                content: data.text || data.html,
                externalId: data.message_id
            };
        } else if (pluginName === "voice") {
            // Generic voice transcription payload
            normalizedInfo = {
                senderId: data.caller_number || "Unknown Caller",
                senderName: data.caller_id || "Unknown",
                content: data.transcript,
                externalId: data.call_sid
            };
        } else {
            // Generic fallback
            normalizedInfo = {
                senderId: data.sender || "Unknown",
                senderName: data.name || "Unknown",
                content: data.message || JSON.stringify(data),
                externalId: data.id || null
            };
        }

        if (!normalizedInfo.content) {
            return NextResponse.json({ error: "Could not extract message content" }, { status: 400 });
        }


        // 3. Save to DB (Phase D will hook LLM here)
        // For now we just create the message without AI
        const newMessage = await prisma.inboxMessage.create({
            data: {
                instanceId: instance.id,
                externalId: normalizedInfo.externalId,
                senderId: normalizedInfo.senderId,
                senderName: normalizedInfo.senderName,
                content: normalizedInfo.content,
                // aiSummary: "pending",
                // aiUrgency: "pending"
            }
        });

        // Try AI summarization immediately (Phase D code will go here, or handled via async queue in production)
        try {
            // Dynamic import to avoid circular dependencies if LLM actions import this file.
            // Assuming src/app/actions/llm.ts has a summarizeMessage function.
            const { summarizeMessage } = await import("@/app/actions/llm");
            const aiResult = await summarizeMessage(newMessage.content);

            if (aiResult && aiResult.summary && aiResult.urgency) {
                await prisma.inboxMessage.update({
                    where: { id: newMessage.id },
                    data: {
                        aiSummary: aiResult.summary,
                        aiUrgency: aiResult.urgency.toLowerCase()
                    }
                });
            }
        } catch (llmError) {
            console.error("LLM Summarization failed during webhook processing:", llmError);
            // Non-blocking error, message is already safely stored.
        }

        return NextResponse.json({ success: true, messageId: newMessage.id });

    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
