"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, PhoneOff, Sparkles, User, MessageSquare, AlertCircle, CheckCircle2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { TicketData } from "./TicketDashboard";

interface LiveCallAssistantProps {
    onComplete: (data: TicketData) => void;
    onCancel: () => void;
}

interface TranscriptItem {
    id: string;
    speaker: "agent" | "customer";
    text: string;
    timestamp: string;
    sentiment?: "positive" | "neutral" | "negative";
}

interface Suggestion {
    id: string;
    type: "question" | "action" | "info";
    text: string;
}

export function LiveCallAssistant({ onComplete, onCancel }: LiveCallAssistantProps) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
    const [currentText, setCurrentText] = useState("");
    const [duration, setDuration] = useState(0);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [sentiment, setSentiment] = useState<"positive" | "neutral" | "negative">("neutral");

    // Mock AI Analysis State
    const [detectedTopic, setDetectedTopic] = useState<string | null>(null);
    const [keyIssues, setKeyIssues] = useState<string[]>([]);

    const recognitionRef = useRef<any>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = "en-US";

                recognition.onresult = (event: any) => {
                    const current = event.resultIndex;
                    const transcriptText = event.results[current][0].transcript;
                };

                recognitionRef.current = recognition;
            } else {
                alert("Speech recognition not supported in this browser. Please use Chrome or Edge.");
            }
        }
    }, []);

    // Timer for call duration
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isListening) {
            interval = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isListening]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
            // Add initial greeting suggestion
            if (transcript.length === 0) {
                setSuggestions([
                    { id: "1", type: "question", text: "How can I help you today?" },
                    { id: "2", type: "info", text: "Verify caller identity" }
                ]);
            }
        }
    };

    const addTranscriptItem = (text: string) => {
        // Simple heuristic to alternate speakers or detect based on context (mock)
        // In a real app, speaker diarization would be handled by the audio model
        const newItem: TranscriptItem = {
            id: Date.now().toString(),
            speaker: Math.random() > 0.5 ? "customer" : "agent", // Random for demo
            text: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sentiment: "neutral" // Mock
        };
        setTranscript(prev => [...prev, newItem]);
    };

    // Mock AI Analysis Logic
    const analyzeText = (text: string) => {
        const lowerText = text.toLowerCase();

        // Topic Detection
        if (lowerText.includes("login") || lowerText.includes("password") || lowerText.includes("access")) {
            setDetectedTopic("Account Access Issue");
            setSuggestions([
                { id: Date.now().toString(), type: "question", text: "Have you tried resetting your password?" },
                { id: (Date.now() + 1).toString(), type: "action", text: "Check account status in AD" }
            ]);
            setKeyIssues(prev => Array.from(new Set([...prev, "User cannot login"])));
        } else if (lowerText.includes("slow") || lowerText.includes("internet") || lowerText.includes("wifi")) {
            setDetectedTopic("Network Connectivity");
            setSuggestions([
                { id: Date.now().toString(), type: "question", text: "Are you on VPN or office network?" },
                { id: (Date.now() + 1).toString(), type: "action", text: "Run speed test" }
            ]);
            setKeyIssues(prev => Array.from(new Set([...prev, "Slow network connection"])));
        } else if (lowerText.includes("printer") || lowerText.includes("jam")) {
            setDetectedTopic("Hardware Malfunction");
            setSuggestions([
                { id: Date.now().toString(), type: "question", text: "What is the printer model number?" },
                { id: (Date.now() + 1).toString(), type: "action", text: "Check printer queue" }
            ]);
        }

        // Sentiment Analysis (Mock)
        if (lowerText.includes("frustrated") || lowerText.includes("angry") || lowerText.includes("urgent") || lowerText.includes("broken")) {
            setSentiment("negative");
        } else if (lowerText.includes("thanks") || lowerText.includes("great") || lowerText.includes("working")) {
            setSentiment("positive");
        }
    };

    const handleEndCall = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        }

        // Generate Ticket Data
        const finalData: TicketData = {
            id: `INC-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
            contact: "Unknown Caller", // In real app, would be identified
            source: "phone",
            duration: formatDuration(duration),
            topic: detectedTopic || "General Inquiry",
            sentiment: sentiment,
            priority: sentiment === "negative" ? "high" : "medium",
            summary: `Call regarding ${detectedTopic || "an issue"}. Transcript analysis indicates ${sentiment} sentiment.`,
            keyIssues: keyIssues.length > 0 ? keyIssues : ["Issue details pending analysis"],
            potentialCauses: ["Pending investigation"],
            actionPoints: [
                { id: "1", text: "Review call transcript", completed: false },
                { id: "2", text: "Follow up with user", completed: false }
            ],
            assignee: "Raju",
            status: "open",
            category: "other",
            timeSpent: formatDuration(duration),
            activityLog: [],
            kbMatches: []
        };

        onComplete(finalData);
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="w-full max-w-6xl mx-auto h-[85vh] flex flex-col md:flex-row gap-6">
            {/* Main Call Area */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "h-3 w-3 rounded-full animate-pulse",
                            isListening ? "bg-red-500" : "bg-slate-300"
                        )} />
                        <div>
                            <h2 className="font-semibold text-slate-900 dark:text-slate-50">Live Call Session</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{formatDuration(duration)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleListening}
                            className={cn(
                                "p-3 rounded-full transition-all",
                                isListening
                                    ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                            )}
                        >
                            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </button>
                        <button
                            onClick={handleEndCall}
                            className="p-3 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                        >
                            <PhoneOff className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Transcript */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                    {transcript.length === 0 && !currentText && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <Activity className="h-12 w-12 mb-4 opacity-20" />
                            <p>Waiting for audio input...</p>
                            <p className="text-sm">Click the microphone to start</p>
                        </div>
                    )}

                    {transcript.map((item) => (
                        <div key={item.id} className={cn(
                            "flex gap-4 max-w-[80%]",
                            item.speaker === "agent" ? "ml-auto flex-row-reverse" : ""
                        )}>
                            <div className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                item.speaker === "agent" ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-600 dark:text-slate-400"
                            )}>
                                {item.speaker === "agent" ? "You" : <User className="h-4 w-4" />}
                            </div>
                            <div className={cn(
                                "p-4 rounded-2xl text-sm",
                                item.speaker === "agent"
                                    ? "bg-indigo-600 text-white rounded-tr-none"
                                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-tl-none shadow-sm"
                            )}>
                                <p>{item.text}</p>
                                <span className={cn(
                                    "text-[10px] mt-1 block opacity-70",
                                    item.speaker === "agent" ? "text-indigo-100" : "text-slate-400"
                                )}>
                                    {item.timestamp}
                                </span>
                            </div>
                        </div>
                    ))}

                    {currentText && (
                        <div className={cn(
                            "flex gap-4 max-w-[80%]",
                            "ml-auto flex-row-reverse" // Assume current speaker is agent for now or toggle? Actually speech API doesn't tell us. Let's assume user input is 'agent' or 'customer' based on context? For now, let's just show it as 'listening'
                        )}>
                            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 animate-pulse">
                                <div className="h-2 w-2 bg-slate-400 rounded-full" />
                            </div>
                            <div className="p-4 rounded-2xl text-sm bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 italic">
                                {currentText}...
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Copilot Sidebar */}
            <div className="w-full md:w-80 flex flex-col gap-4">
                {/* Sentiment Card */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Live Sentiment</h3>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "text-2xl p-2 rounded-full bg-slate-50 dark:bg-slate-800/50",
                            sentiment === "positive" ? "bg-green-100" : sentiment === "negative" ? "bg-red-100" : ""
                        )}>
                            {sentiment === "positive" ? "😊" : sentiment === "negative" ? "😠" : "😐"}
                        </div>
                        <div>
                            <p className="font-medium text-slate-900 dark:text-slate-50 capitalize">{sentiment}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Based on tone & keywords</p>
                        </div>
                    </div>
                </div>

                {/* Topic Detection */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Detected Topic</h3>
                    {detectedTopic ? (
                        <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100">
                            <Sparkles className="h-4 w-4" />
                            <span className="font-medium text-sm">{detectedTopic}</span>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 italic">Listening for context...</p>
                    )}
                </div>

                {/* Suggestions */}
                <div className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">AI Suggestions</h3>
                    <div className="space-y-3 overflow-y-auto flex-1">
                        {suggestions.map((suggestion) => (
                            <div key={suggestion.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors cursor-pointer group">
                                <div className="flex gap-2 items-start">
                                    {suggestion.type === "question" ? (
                                        <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5" />
                                    ) : suggestion.type === "action" ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                                    ) : (
                                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                                    )}
                                    <p className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-900">{suggestion.text}</p>
                                </div>
                            </div>
                        ))}
                        {suggestions.length === 0 && (
                            <div className="text-center py-8 text-slate-400">
                                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">AI is listening to provide suggestions...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
