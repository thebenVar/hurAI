"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Monitor, MonitorOff, Sparkles, Eye, Camera, AlertCircle, CheckCircle2, Lightbulb, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { TicketData } from "./TicketDashboard";
import { motion, AnimatePresence } from "framer-motion";

interface ScreenShareAssistantProps {
    onComplete: (data: TicketData) => void;
    onCancel: () => void;
}

interface DetectedAction {
    id: string;
    timestamp: string;
    action: string;
    category: "navigation" | "error" | "input" | "system";
    screenshot?: string;
}

interface KeyLearning {
    id: string;
    text: string;
    type: "issue" | "solution" | "tip" | "process";
}

export function ScreenShareAssistant({ onComplete, onCancel }: ScreenShareAssistantProps) {
    const [isSharing, setIsSharing] = useState(false);
    const [duration, setDuration] = useState(0);
    const [detectedActions, setDetectedActions] = useState<DetectedAction[]>([]);
    const [keyIssues, setKeyIssues] = useState<string[]>([]);
    const [keyLearnings, setKeyLearnings] = useState<KeyLearning[]>([]);
    const [currentActivity, setCurrentActivity] = useState<string | null>(null);
    const [detectedTopic, setDetectedTopic] = useState<string | null>(null);
    const [startTime, setStartTime] = useState<Date | null>(null);
    
    const streamRef = useRef<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Timer for session duration
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isSharing) {
            interval = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isSharing]);

    // Format duration as MM:SS
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Add detected action to timeline
    const addDetectedAction = useCallback((action: string, category: DetectedAction["category"], screenshot?: string) => {
        const newAction: DetectedAction = {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            action,
            category,
            screenshot
        };

        setDetectedActions(prev => [...prev, newAction]);
        setCurrentActivity(action);
    }, []);

    // Detect overall topic from actions
    const detectTopic = useCallback((currentActions: DetectedAction[]) => {
        const actions = currentActions.map(a => a.action.toLowerCase()).join(' ');
        
        if (actions.includes('login') || actions.includes('credentials') || actions.includes('password')) {
            setDetectedTopic("Authentication & Access Issues");
        } else if (actions.includes('error') || actions.includes('503') || actions.includes('timeout')) {
            setDetectedTopic("System Errors & Connectivity");
        } else if (actions.includes('settings') || actions.includes('configuration')) {
            setDetectedTopic("Configuration & Settings");
        } else if (actions.includes('update') || actions.includes('install')) {
            setDetectedTopic("Software Updates & Installation");
        }
    }, []);

    // Generate learnings from session
    const generateLearnings = useCallback((currentKeyLearnings: KeyLearning[]) => {
        const learningPool: KeyLearning[] = [
            { id: "1", text: "User attempted login 3 times before encountering error - suggests credentials may be correct", type: "issue" },
            { id: "2", text: "Browser console shows CORS errors - indicates backend configuration issue", type: "issue" },
            { id: "3", text: "Clear browser cache and cookies before retry", type: "solution" },
            { id: "4", text: "Check if VPN is enabled - may cause connectivity issues", type: "solution" },
            { id: "5", text: "User is comfortable with browser DevTools - intermediate technical skill level", type: "tip" },
            { id: "6", text: "Document the error codes for future reference", type: "process" },
            { id: "7", text: "Similar pattern seen in previous ticket #1234", type: "tip" },
        ];

        // Add learnings gradually (max 5)
        const currentCount = currentKeyLearnings.length;
        if (currentCount < 5 && Math.random() > 0.7) {
            const newLearning = learningPool.find(l => !currentKeyLearnings.find(kl => kl.id === l.id));
            if (newLearning) {
                setKeyLearnings(prev => [...prev, newLearning]);
            }
        }
    }, []);

    const performMockAnalysis = useCallback((screenshot: string) => {
        // Simulate detecting different types of activities
        const mockScenarios = [
            { action: "User navigating to login page", category: "navigation" as const, issue: "Login interface accessed" },
            { action: "Error dialog detected: 'Connection timeout'", category: "error" as const, issue: "Network timeout error observed" },
            { action: "User entering credentials", category: "input" as const, issue: null },
            { action: "Browser console showing 503 errors", category: "error" as const, issue: "HTTP 503 Service Unavailable" },
            { action: "Opening application settings", category: "navigation" as const, issue: null },
            { action: "System notification: 'Update required'", category: "system" as const, issue: "Software update pending" },
        ];

        // Randomly pick a scenario for demo
        const scenario = mockScenarios[Math.floor(Math.random() * mockScenarios.length)];

        addDetectedAction(scenario.action, scenario.category, screenshot);

        if (scenario.issue) {
            setKeyIssues(prev => Array.from(new Set([...prev, scenario.issue!])));
        }

        // Use functional form of setState to get the latest state
        setDetectedActions(currentActions => {
            detectTopic(currentActions);
            return currentActions;
        });
        setKeyLearnings(currentLearnings => {
            generateLearnings(currentLearnings);
            return currentLearnings;
        });

    }, [addDetectedAction, detectTopic, generateLearnings]);

    // Capture current frame and analyze
    const captureAndAnalyze = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current frame
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get image data for analysis
        const imageData = canvas.toDataURL('image/png');

        // Mock AI Analysis - In production, send to AI vision API
        performMockAnalysis(imageData);

    }, [performMockAnalysis]);
    
    // Stop screen sharing
    const stopScreenShare = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (analysisIntervalRef.current) {
            clearInterval(analysisIntervalRef.current);
            analysisIntervalRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setIsSharing(false);
        addDetectedAction("Screen sharing session ended", "system");
    }, [addDetectedAction]);

    // Start screen sharing
    const startScreenShare = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false
            });

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            setIsSharing(true);
            setStartTime(new Date());

            // Listen for stream end (user stops sharing via browser UI)
            stream.getVideoTracks()[0].addEventListener('ended', stopScreenShare);

            // Start periodic analysis (every 5 seconds)
            analysisIntervalRef.current = setInterval(captureAndAnalyze, 5000);

            // Add initial activity
            addDetectedAction("Screen sharing session started", "system");

        } catch (err) {
            console.error("Error starting screen share:", err);
            alert("Failed to start screen sharing. Please ensure you granted permission.");
        }
    }, [addDetectedAction, captureAndAnalyze, stopScreenShare]);

    // Handle completion and data packaging
    const handleComplete = () => {
        stopScreenShare();
        const duration = startTime ? (new Date().getTime() - startTime.getTime()) / 1000 : 0;

        // Generate comprehensive ticket data
        const ticketData: TicketData = {
            id: `INC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
            contact: "Screen Share Session User",
            source: "screen-share",
            duration: formatDuration(duration),
            topic: detectedTopic || "Screen Share Session Summary",
            status: "open",
            priority: "medium",
            sentiment: "neutral",
            summary: `Key issues identified: ${keyIssues.join(', ')}. See session activity log for details.`,
            keyIssues: keyIssues,
            potentialCauses: [],
            actionPoints: [],
            category: "software",
            assignee: "Tier 1 Support",
            timeSpent: formatDuration(duration),
            activityLog: [
                {
                    id: "act_start",
                    timestamp: startTime?.toISOString() || new Date().toISOString(),
                    type: "log",
                    author: "System",
                    content: "Screen share session started.",
                },
                ...detectedActions.map(a => ({
                    id: `act_${a.id}`,
                    timestamp: new Date().toISOString(),
                    type: a.category === 'error' ? 'log' as const : 'note' as const,
                    author: "User",
                    content: a.action,
                })),
                {
                    id: "act_end",
                    timestamp: new Date().toISOString(),
                    type: "log",
                    author: "System",
                    content: "Screen share session ended.",
                    metadata: {
                        actionsDetected: detectedActions.length
                    }
                }
            ]
        };

        onComplete(ticketData);
    };

    const getCategoryIcon = (category: DetectedAction["category"]) => {
        switch (category) {
            case "navigation": return <Eye className="h-4 w-4" />;
            case "error": return <AlertCircle className="h-4 w-4" />;
            case "input": return <Camera className="h-4 w-4" />;
            case "system": return <CheckCircle2 className="h-4 w-4" />;
        }
    };

    const getCategoryColor = (category: DetectedAction["category"]) => {
        switch (category) {
            case "navigation": return "bg-blue-50 text-blue-700 border-blue-200";
            case "error": return "bg-red-50 text-red-700 border-red-200";
            case "input": return "bg-purple-50 text-purple-700 border-purple-200";
            case "system": return "bg-green-50 text-green-700 border-green-200";
        }
    };

    const getLearningIcon = (type: KeyLearning["type"]) => {
        switch (type) {
            case "issue": return <AlertCircle className="h-4 w-4" />;
            case "solution": return <CheckCircle2 className="h-4 w-4" />;
            case "tip": return <Lightbulb className="h-4 w-4" />;
            case "process": return <BookOpen className="h-4 w-4" />;
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="relative w-full max-w-6xl mx-auto bg-slate-900/70 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-purple-500/30">
                <div className="bg-linear-to-r from-purple-500 to-indigo-600 px-8 py-6 text-white">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
                                <Monitor className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Live Screen Share Assistant</h2>
                                <p className="text-purple-100 text-sm mt-1">
                                    AI-powered screen activity analysis and issue detection
                                </p>
                            </div>
                        </div>
                        {isSharing && (
                            <div className="text-right">
                                <div className="text-3xl font-mono font-bold">{formatDuration(duration)}</div>
                                <div className="text-purple-100 text-xs">Duration</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Video Preview - Hidden but used for capture */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-video">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    className="w-full h-full object-contain"
                                />
                                {!isSharing && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                                        <div className="text-center">
                                            <Monitor className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                                            <p className="text-slate-400">Screen preview will appear here</p>
                                        </div>
                                    </div>
                                )}
                                {isSharing && currentActivity && (
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-lg flex items-center gap-2"
                                        >
                                            <Sparkles className="h-4 w-4 text-purple-400" />
                                            <span className="text-sm">{currentActivity}</span>
                                        </motion.div>
                                    </div>
                                )}
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-center gap-4">
                                {!isSharing ? (
                                    <button
                                        onClick={startScreenShare}
                                        className="flex items-center gap-3 px-8 py-4 bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                                    >
                                        <Monitor className="h-5 w-5" />
                                        Start Screen Sharing
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={stopScreenShare}
                                            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                                        >
                                            <MonitorOff className="h-5 w-5" />
                                            Stop Sharing
                                        </button>
                                        <div className="flex flex-col sm:flex-row gap-4 mt-8">
                                            <button
                                                onClick={handleComplete}
                                                className="flex items-center gap-3 px-8 py-4 bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-white"
                                            >
                                                <CheckCircle2 className="h-5 w-5" />
                                                Complete Session & Create Ticket
                                            </button>
                                        </div>
                                    </>
                                )}
                                <button
                                    onClick={onCancel}
                                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>

                            {/* Detected Actions Timeline */}
                            {detectedActions.length > 0 && (
                                <div className="bg-slate-50 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                        <Eye className="h-5 w-5 text-purple-600" />
                                        Detected Actions ({detectedActions.length})
                                    </h3>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        <AnimatePresence>
                                            {detectedActions.slice().reverse().map((action) => (
                                                <motion.div
                                                    key={action.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className={cn(
                                                        "flex items-start gap-3 p-3 rounded-lg border",
                                                        getCategoryColor(action.category)
                                                    )}
                                                >
                                                    <div className="mt-0.5">
                                                        {getCategoryIcon(action.category)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium">{action.action}</p>
                                                        <p className="text-xs opacity-70 mt-1">{action.timestamp}</p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* AI Insights Sidebar */}
                        <div className="w-full lg:w-1/3 flex flex-col gap-6">
                            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                                <h3 className="text-xl font-bold text-white mb-4">Session Learnings</h3>
                                <div className="bg-linear-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                                    {keyLearnings.length > 0 ? (
                                        <ul className="space-y-4">
                                            {keyLearnings.map((learning) => (
                                                <li key={learning.id} className="flex items-start gap-3">
                                                    <div className="text-purple-600 mt-0.5">
                                                        {getLearningIcon(learning.type)}
                                                    </div>
                                                    <p className="text-slate-700 text-sm">{learning.text}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-slate-500 text-sm">
                                            No key learnings detected yet. Interact with the screen share to generate insights.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Detected Topic */}
                            {detectedTopic && (
                                <div className="bg-linear-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                                    <h3 className="text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
                                        <Sparkles className="h-4 w-4" />
                                        Detected Topic
                                    </h3>
                                    <p className="text-lg font-bold text-purple-700">{detectedTopic}</p>
                                </div>
                            )}

                            {/* Key Issues */}
                            {keyIssues.length > 0 && (
                                <div className="bg-white rounded-xl p-6 border border-slate-200">
                                    <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-red-600" />
                                        Key Issues ({keyIssues.length})
                                    </h3>
                                    <ul className="space-y-2">
                                        {keyIssues.map((issue, idx) => (
                                            <motion.li
                                                key={idx}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-start gap-2 text-sm text-slate-700"
                                            >
                                                <span className="text-red-600 mt-1">•</span>
                                                <span>{issue}</span>
                                            </motion.li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden canvas for frame capture */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
