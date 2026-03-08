import { NextResponse } from "next/server";
import { handleSlackOAuthCallback } from "@/app/actions/integrations";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const settingsUrl = new URL('/settings', baseUrl);
    settingsUrl.searchParams.set('tab', 'integrations');

    if (error) {
        settingsUrl.searchParams.set('error', `Slack authorization failed: ${error}`);
        return NextResponse.redirect(settingsUrl);
    }

    if (!code || !state) {
        settingsUrl.searchParams.set('error', 'Missing code or state from Slack');
        return NextResponse.redirect(settingsUrl);
    }

    const result = await handleSlackOAuthCallback(code, state);

    if (result.success) {
        settingsUrl.searchParams.set('success', 'Slack integration installed successfully!');
    } else {
        settingsUrl.searchParams.set('error', result.error || 'Failed to install Slack integration');
    }

    return NextResponse.redirect(settingsUrl);
}
