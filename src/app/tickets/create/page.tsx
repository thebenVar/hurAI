"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AudioUploader } from "@/components/AudioUploader";
import { AnalysisLoader } from "@/components/AnalysisLoader";
import { TicketDashboard, type TicketData } from "@/components/TicketDashboard";
import { ManualTicketForm } from "@/components/ManualTicketForm";
import { generateTicketDetails } from "@/app/actions/llm";
import { LiveCallAssistant } from "@/components/LiveCallAssistant";
import { Headset, Sparkles, PenLine, Mic } from "lucide-react";

// Mock data for the experiment
const MOCK_TICKET_DATA: TicketData = {
    id: "INC-2024-8492",
    contact: "Anjali Sharma",
    source: "phone",
    duration: "4m 12s",
    topic: "Login Authentication Failure",
    sentiment: "negative",
    priority: "high",
    summary: "User is unable to log in to the enterprise portal after the recent security update. She reports receiving an 'Error 503' message despite using correct credentials. She has already tried clearing cache and resetting her password without success.",
    keyIssues: [
        "Persistent Error 503 on login attempt",
        "Password reset did not resolve the issue",
        "User is blocked from accessing critical financial reports"
    ],
    potentialCauses: [
        "Recent security patch deployment (v2.4.1) might have caused a regression",
        "SSO Service timeout or misconfiguration",
        "User account might be locked at the directory level"
    ],
    actionPoints: [
        { id: "ap-1", text: "Check server logs for 503 errors during the reported timestamp", completed: false, isNextAction: false },
        { id: "ap-2", text: "Verify SSO connectivity status with the identity provider", completed: true, isNextAction: false },
        { id: "ap-3", text: "Temporarily whitelist user IP if urgent access is needed", completed: false, isNextAction: true },
        { id: "ap-4", text: "Escalate to DevOps if widespread outage is suspected", completed: false, isNextAction: false }
    ],
    assignee: "Raju",
    status: "open",
    category: "software",
    timeSpent: "15m",
    activityLog: [
        {
            id: "1",
            type: "call",
            author: "System",
            timestamp: "Today, 10:23 AM",
            content: "Incoming call from Anjali Sharma (Duration: 4m 12s)",
            metadata: { duration: "4m 12s" }
        },
        {
            id: "2",
            type: "log",
            author: "System",
            timestamp: "Today, 10:24 AM",
            content: "Error 503 detected in auth_service logs. Trace ID: #8f92-1a2b"
        },
        {
            id: "3",
            type: "note",
            author: "AI Assistant",
            timestamp: "Today, 10:25 AM",
            content: "Based on the call transcript, the user is frustrated. Priority escalated to High."
        },
        {
            id: "4",
            type: "message",
            author: "Raju",
            timestamp: "Today, 10:30 AM",
            content: "I'm investigating the SSO configuration now. It looks like a certificate mismatch."
        }
    ],
    kbMatches: [
        {
            id: "kb-1",
            title: "Configuring SSO with Azure AD",
            excerpt: "Step-by-step guide to setting up Single Sign-On using Azure Active Directory, including certificate management.",
            source: "documentation",
            url: "#",
            relevance: 95
        },
        {
            id: "kb-2",
            title: "Ticket #402: SSO Login Failure",
            excerpt: "Resolved issue where expired certificates caused 503 errors during login flow.",
            source: "previous_ticket",
            url: "#",
            relevance: 88
        },
        {
            id: "kb-3",
            title: "Community: Best practices for auth certificates",
            excerpt: "Discussion on how to rotate certificates without downtime.",
            source: "forum",
            url: "#",
            relevance: 72
        }
    ]
};

function CreateTicketContent() {
    const searchParams = useSearchParams();
    const [viewState, setViewState] = useState<"selection" | "upload" | "processing" | "result" | "manual-entry" | "live-call">("selection");
    const [ticketData, setTicketData] = useState<TicketData | null>(null);

    // Pre-fill data from URL params
    const initialContact = searchParams.get("contact") || "";
    const initialDescription = searchParams.get("description") || "";
    const initialSource = searchParams.get("source") as any || "phone";

    useEffect(() => {
        const analyzeMessage = async () => {
            if (searchParams.get("view") === "manual-entry" && initialDescription) {
                // Show partial loading state? For now just switching view.
                setViewState("manual-entry");

                if (!ticketData) {
                    // Call the Server Action
                    try {
                        const aiData = await generateTicketDetails(initialDescription);
                        if (aiData) {
                            // We don't set ticketData (result view) yet, we pass it to the form
                            // But we need a way to pass this async data to ManualTicketForm
                            // Since ManualTicketForm takes initialData prop, we can store this in a state
                            setAiInitialData({
                                summary: aiData.summary,
                                category: aiData.category,
                                subCategory: aiData.subCategory,
                                priority: aiData.priority,
                                sentiment: aiData.sentiment,
                                keyIssues: aiData.keyIssues,
                                potentialCauses: aiData.potentialCauses,
                                actionPoints: aiData.suggestedActions,
                                isUserSolvable: aiData.isUserSolvable,
                                userSolvableReason: aiData.userSolvableReason,
                                followUpQuestions: aiData.followUpQuestions
                            });
                        }
                    } catch (e) {
                        console.error("AI Analysis failed", e);
                    }
                }
            }
        };

        analyzeMessage();
    }, [searchParams, initialDescription]);

    const [aiInitialData, setAiInitialData] = useState<any>(null);

    const handleFileSelect = (file: File) => {
        setViewState("processing");
    };

    const handleProcessingComplete = () => {
        setTicketData(MOCK_TICKET_DATA);
        setViewState("result");
    };

    const handleManualSubmit = (data: TicketData) => {
        setTicketData(data);
        setViewState("result");
    };

    const handleLiveCallComplete = (data: TicketData) => {
        setTicketData(data);
        setViewState("result");
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Create New Ticket</h1>
                <p className="text-slate-500 mt-2">Choose how you want to create a ticket: upload a call recording, start a live session, or enter details manually.</p>
            </div>

            <div className="relative min-h-[400px]">
                {viewState === "selection" && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Upload Option */}
                            <button
                                onClick={() => setViewState("upload")}
                                className="group flex flex-col items-center gap-6 p-8 bg-white rounded-3xl border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 text-center h-full"
                            >
                                <div className="h-16 w-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Headset className="h-8 w-8" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Upload Call Recording</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        Upload MP3/WAV files for AI analysis and auto-ticket generation.
                                    </p>
                                </div>
                            </button>

                            {/* Live Call Option */}
                            <button
                                onClick={() => setViewState("live-call")}
                                className="group flex flex-col items-center gap-6 p-8 bg-white rounded-3xl border-2 border-dashed border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 transition-all duration-300 text-center h-full"
                            >
                                <div className="h-16 w-16 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Mic className="h-8 w-8" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Start Live Call</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        Real-time transcription and AI assistance during the call.
                                    </p>
                                </div>
                            </button>

                            {/* Manual Entry Option */}
                            <button
                                onClick={() => setViewState("manual-entry")}
                                className="group flex flex-col items-center gap-6 p-8 bg-white rounded-3xl border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all duration-300 text-center h-full"
                            >
                                <div className="h-16 w-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <PenLine className="h-8 w-8" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Add New Ticket</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        Manually enter ticket details without AI assistance.
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {viewState === "upload" && (
                    <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6">
                        <button
                            onClick={() => setViewState("selection")}
                            className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-2"
                        >
                            ← Back to options
                        </button>
                        <AudioUploader onFileSelect={handleFileSelect} />
                    </div>
                )}

                {viewState === "manual-entry" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                        <button
                            onClick={() => setViewState("selection")}
                            className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-2"
                        >
                            ← Back to options
                        </button>
                        <ManualTicketForm
                            onSubmit={handleManualSubmit}
                            onCancel={() => setViewState("selection")}
                            initialData={{
                                contact: initialContact,
                                summary: initialDescription,
                                source: initialSource,
                                ...aiInitialData
                            }}
                        />
                    </div>
                )}

                {viewState === "live-call" && (
                    <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6">
                        <button
                            onClick={() => setViewState("selection")}
                            className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-2"
                        >
                            ← Back to options
                        </button>
                        <LiveCallAssistant
                            onComplete={handleLiveCallComplete}
                            onCancel={() => setViewState("selection")}
                        />
                    </div>
                )}

                {viewState === "processing" && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <AnalysisLoader onComplete={handleProcessingComplete} />
                    </div>
                )}

                {viewState === "result" && ticketData && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    setViewState("selection");
                                    setTicketData(null);
                                }}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                            >
                                Create Another Ticket
                            </button>
                        </div>
                        <TicketDashboard data={ticketData} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CreateTicketPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreateTicketContent />
        </Suspense>
    );
}
