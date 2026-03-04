"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AudioUploader } from "@/components/AudioUploader";
import { AnalysisLoader } from "@/components/AnalysisLoader";
import { TicketDashboard, type TicketData } from "@/components/TicketDashboard";
import { ManualTicketForm } from "@/components/ManualTicketForm";
import { generateTicketDetails } from "@/app/actions/llm";
import { createTicket } from "@/app/actions/tickets";
import { LiveCallAssistant } from "@/components/LiveCallAssistant";
import { Headset, Sparkles, PenLine, Mic } from "lucide-react";

// Mock data removed in favor of DB


function CreateTicketContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [viewState, setViewState] = useState<"selection" | "upload" | "processing" | "result" | "manual-entry" | "live-call">("selection");
    const [ticketData, setTicketData] = useState<TicketData | null>(null);

    // Pre-fill data from URL params
    const initialContact = searchParams.get("contact") || "";
    const initialDescription = searchParams.get("description") || "";
    const initialSource = searchParams.get("source") as any || "phone";

    const [aiInitialData, setAiInitialData] = useState<any>(null);

    useEffect(() => {
        const analyzeMessage = async () => {
            if (searchParams.get("view") === "manual-entry" && initialDescription) {
                setViewState("manual-entry");

                if (!aiInitialData) {
                    try {
                        const aiData = await generateTicketDetails(initialDescription);
                        if (aiData) {
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

    const handleFileSelect = (file: File) => {
        setViewState("processing");
    };

    const handleProcessingComplete = () => {
        // setTicketData(MOCK_TICKET_DATA); // Removed
        setViewState("result");
    };

    const handleManualSubmit = async (data: TicketData) => {
        try {
            const result = await createTicket(data);
            if (result.success) {
                router.push(`/tickets/${result.ticketId}`);
            } else {
                console.error("Failed to create ticket:", result.error);
            }
        } catch (error) {
            console.error("Error creating ticket:", error);
        }
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
