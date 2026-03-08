"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// ── Plugin Management ───────────────────────────────────────

export async function getPlugins() {
    return prisma.integrationPlugin.findMany({
        include: {
            instances: {
                select: { id: true, name: true, isActive: true, createdAt: true, config: true }
            }
        },
        orderBy: [
            { status: 'desc' }, // 'stable' before 'beta'
            { name: 'asc' }
        ]
    });
}

export async function installPlugin(pluginId: string, name: string, config: any) {
    const session = await auth();
    const role = session?.user?.role;

    if (role !== "admin" && role !== "super_admin") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const instance = await prisma.integrationInstance.create({
            data: {
                pluginId,
                name,
                config: JSON.stringify(config),
                isActive: true,
            }
        });

        return { success: true, instanceId: instance.id };
    } catch (error) {
        console.error("Error installing plugin:", error);
        return { success: false, error: "Failed to install plugin" };
    }
}

export async function updatePluginConfig(instanceId: string, name: string, config: any) {
    const session = await auth();
    const role = session?.user?.role;

    if (role !== "admin" && role !== "super_admin") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const instance = await prisma.integrationInstance.update({
            where: { id: instanceId },
            data: {
                name,
                config: JSON.stringify(config),
            }
        });

        return { success: true, instanceId: instance.id };
    } catch (error) {
        console.error("Error updating plugin config:", error);
        return { success: false, error: "Failed to update plugin config" };
    }
}

export async function uninstallPlugin(instanceId: string) {
    const session = await auth();
    const role = session?.user?.role;

    if (role !== "admin" && role !== "super_admin") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // Option 1: Hard delete
        await prisma.integrationInstance.delete({
            where: { id: instanceId }
        });

        // Option 2: Soft delete / mark inactive (using this if we want to keep history)
        // await prisma.integrationInstance.update({
        //     where: { id: instanceId },
        //     data: { isActive: false }
        // });

        return { success: true };
    } catch (error) {
        console.error("Error uninstalling plugin:", error);
        return { success: false, error: "Failed to uninstall plugin" };
    }
}

// ── Slack OAuth Flow ───────────────────────────────────────

export async function generateSlackOAuthUrl() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const clientId = process.env.SLACK_CLIENT_ID;
    if (!clientId) return { success: false, error: "Slack Client ID not configured" };

    const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/slack/callback`;
    const scopes = "channels:history,chat:write,users:read";

    // We pass the user ID in the state so we know who authorized it
    const state = Buffer.from(JSON.stringify({ userId: session.user.id })).toString('base64');

    const url = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&user_scope=&redirect_uri=${redirectUri}&state=${state}`;

    return { success: true, url };
}

export async function handleSlackOAuthCallback(code: string, state: string) {
    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/slack/callback`;

    if (!clientId || !clientSecret) {
        return { success: false, error: "Slack credentials not configured in environment" };
    }

    try {
        const response = await fetch("https://slack.com/api/oauth.v2.access", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri
            })
        });

        const data = await response.json();

        if (!data.ok) {
            console.error("Slack OAuth Error:", data);
            return { success: false, error: data.error };
        }

        // Get the Slack plugin ID
        const slackPlugin = await prisma.integrationPlugin.findFirst({
            where: { name: "Slack" }
        });

        if (!slackPlugin) {
            return { success: false, error: "Slack plugin not found in database" };
        }

        // Create the instance
        const instance = await prisma.integrationInstance.create({
            data: {
                pluginId: slackPlugin.id,
                name: `Slack (${data.team.name})`,
                config: JSON.stringify({
                    bot_token: data.access_token,
                    // Store other useful info
                    team_id: data.team.id,
                    team_name: data.team.name,
                    authed_user_id: data.authed_user.id
                }),
                isActive: true
            }
        });

        return { success: true, instanceId: instance.id };
    } catch (error) {
        console.error("Failed to handle Slack callback:", error);
        return { success: false, error: "Internal Server Error during Slack OAuth" };
    }
}
