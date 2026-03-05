"use client";

import {
    CheckCircle2,
    AlertCircle,
    Clock,
    User,
    Phone,
    Tag,
    ThumbsUp,
    ThumbsDown,
    Copy,
    Mail,
    MessageCircle,
    Users,
    Monitor,
    AppWindow,
    Wifi,
    Key,
    Globe,
    GraduationCap,
    Truck,
    Lightbulb,
    ArrowRight,
    X,
    Plus,
    Star,
    Sparkles,
    Loader2,
    Brain,
    FileText as FileTextIcon,
    Trash2
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TicketActivity, ActivityItem } from "./TicketActivity";
import { KnowledgeBaseSuggestions, KBArticle } from "./KnowledgeBaseSuggestions";
import {
    addActivityLog,
    escalateTicket,
    updateSatisfaction,
    toggleActionPoint,
    updateTicketAiFields,
    softDeleteTicket
} from "@/app/actions/tickets";
import { generateTicketDetails } from "@/app/actions/llm";
import { getAiConfiguration } from "@/app/actions/settings";
import { useRouter } from "next/navigation";

export interface TicketData {
    id: string;
    contact: string;
    source: "phone" | "email" | "whatsapp" | "in-person" | "web" | "other";
    duration: string;
    topic: string;
    sentiment: "positive" | "neutral" | "negative";
    priority: "low" | "medium" | "high";
    summary: string;
    aiSummary?: string; // LLM-generated executive summary
    keyIssues: string[];
    actionPoints: { id: string; text: string; completed: boolean; isNextAction?: boolean }[];
    potentialCauses: string[];
    // New attributes
    subCategory?: string;
    isUserSolvable?: boolean;
    userSolvableReason?: string;
    followUpQuestions?: string[];
    isEscalated?: boolean;
    satisfactionScore?: number | null;

    assignee: string;
    status: "open" | "in-progress" | "resolved" | "closed" | "deleted";
    category: "hardware" | "software" | "network" | "access" | "translation" | "training" | "logistics" | "other";
    timeSpent: string;
    ticketNumber?: number;
    activityLog: ActivityItem[];
    kbMatches: KBArticle[];
}

export function TicketDashboard({ data }: { data: TicketData }) {
    const router = useRouter();

    // Local state
    const [actions, setActions] = useState(data.actionPoints);
    const [activities, setActivities] = useState(data.activityLog);
    const [keyIssues, setKeyIssues] = useState<string[]>(data.keyIssues);
    const [potentialCauses, setPotentialCauses] = useState<string[]>(data.potentialCauses);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzeError, setAnalyzeError] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<string>("Gemini 1.5 Flash");
    const [availableModels, setAvailableModels] = useState<string[]>(["Gemini 1.5 Flash"]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [userRole, setUserRole] = useState<string>("guest");

    // Fetch session/role and models on mount
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // We'll get user info from a separate action or just check local storage/context if available
                // For now, let's assume we can fetch it or it's passed down. 
                // Since this is a client component, we should probably fetch the session.
                const res = await fetch('/api/auth/session');
                const session = await res.json();
                if (session?.user?.role) setUserRole(session.user.role);

                const config = await getAiConfiguration();
                const models = [];
                if (config.geminiKey) {
                    models.push("Gemini 1.5 Flash");
                    models.push("Gemini 1.5 Pro");
                }
                if (config.openAiKey) {
                    models.push("GPT-4o");
                    models.push("GPT-3.5 Turbo");
                }
                if (config.anthropicKey) {
                    models.push("Claude 3.5 Sonnet");
                }

                if (models.length > 0) {
                    setAvailableModels(models);
                    // Use the default model from config if it matches one of our patterns
                    if (config.defaultModel && models.includes(config.defaultModel)) {
                        setSelectedModel(config.defaultModel);
                    } else {
                        setSelectedModel(models[0]);
                    }
                }
            } catch (err) {
                console.error("Failed to load model availability:", err);
            }
        };
        loadInitialData();
    }, []);

    const handleSoftDelete = async () => {
        setIsDeleting(true);
        const res = await softDeleteTicket(data.id);
        if (res.success) {
            router.push('/tickets'); // Redirect to list after delete
            router.refresh();
        } else {
            alert(res.error || "Failed to delete ticket");
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const formattedTicketId = data.ticketNumber
        ? `#TKT-${data.ticketNumber.toString().padStart(3, '0')}`
        : `#${data.id.substring(0, 8)}...`;

    // Key Issues CRUD state
    const [newIssueText, setNewIssueText] = useState("");
    const [editingIssueIdx, setEditingIssueIdx] = useState<number | null>(null);
    const [editIssueText, setEditIssueText] = useState("");

    // Potential Causes CRUD state
    const [newCauseText, setNewCauseText] = useState("");
    const [editingCauseIdx, setEditingCauseIdx] = useState<number | null>(null);
    const [editCauseText, setEditCauseText] = useState("");

    // Manual AI Analysis trigger
    const handleAnalyzeWithAI = async () => {
        if (isAnalyzing) return;
        setIsAnalyzing(true);
        setAnalyzeError(null);
        try {
            const analysisText = `Topic: ${data.topic}\n\n${data.summary}`;
            const aiData = await generateTicketDetails(analysisText, selectedModel);
            if (aiData) {
                await updateTicketAiFields(data.id, {
                    aiSummary: aiData.summary,
                    category: aiData.category,
                    subCategory: aiData.subCategory,
                    priority: aiData.priority,
                    sentiment: aiData.sentiment,
                    isUserSolvable: aiData.isUserSolvable,
                    userSolvableReason: aiData.userSolvableReason,
                    followUpQuestions: aiData.followUpQuestions,
                    suggestedActions: aiData.suggestedActions,
                    keyIssues: aiData.keyIssues,
                    potentialCauses: aiData.potentialCauses,
                });
                // Update local UI state immediately without page reload
                setKeyIssues(aiData.keyIssues);
                setPotentialCauses(aiData.potentialCauses);
                if (aiData.suggestedActions?.length) {
                    const newAPs = aiData.suggestedActions.map((text, i) => ({
                        id: `ai-${Date.now()}-${i}`,
                        text,
                        completed: false,
                        isNextAction: false
                    }));
                    setActions(prev => [...prev, ...newAPs]);
                }
                logActivity("log", "AI analysis completed — suggestions updated.");
                router.refresh(); // Reload to get aiSummary in Quick Insight
            } else {
                setAnalyzeError("AI analysis failed. Please try again.");
            }
        } catch (err) {
            setAnalyzeError("Error running analysis. Check your API key.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Action Point UI State
    const [newActionText, setNewActionText] = useState("");
    const [newActionNote, setNewActionNote] = useState("");
    const [showAddNote, setShowAddNote] = useState(false);

    const [editingActionId, setEditingActionId] = useState<string | null>(null);
    const [editActionText, setEditActionText] = useState("");
    const [editActionReason, setEditActionReason] = useState("");

    const [deletingActionId, setDeletingActionId] = useState<string | null>(null);
    const [deleteReason, setDeleteReason] = useState("");

    // Update local state when prop changes
    useEffect(() => {
        setActions(data.actionPoints);
        setActivities(data.activityLog);
    }, [data.actionPoints, data.activityLog]);

    // Helper to log activities
    const logActivity = async (type: ActivityItem["type"], content: string, note?: string) => {
        const fullContent = note ? `${content}\n\nNote: ${note}` : content;

        // Optimistic UI update
        const newActivity: ActivityItem = {
            id: `act-${Date.now()}`,
            type,
            author: "Loading...",
            timestamp: "Just now",
            content: fullContent
        };
        setActivities(prev => [newActivity, ...prev]);

        // Real server action
        const result = await addActivityLog(data.id, type, fullContent);
        if (result.success && result.activity) {
            setActivities(prev => prev.map(a =>
                a.id === newActivity.id
                    ? { ...a, id: result.activity.id, author: result.activity.author }
                    : a
            ));
        }
    };

    // Handler for adding activity from the Activity Log component
    const handleAddActivity = async (type: string, content: string) => {
        await logActivity(type as ActivityItem["type"], content);
    };

    const handleCiteArticle = async (article: KBArticle) => {
        await logActivity("note", `Suggested reference: ${article.title} (${article.url})`);
    };

    // Action Point Handlers
    const toggleAction = async (id: string) => {
        const action = actions.find(a => a.id === id);
        if (!action) return;

        const newCompleted = !action.completed;

        // Optimistic update
        setActions(prev => prev.map(a =>
            a.id === id ? { ...a, completed: newCompleted } : a
        ));

        logActivity("status_change", `Marked action point '${action.text}' as ${newCompleted ? "completed" : "incomplete"}`);

        // Real server action
        await toggleActionPoint(id, newCompleted);
    };

    const handleEscalate = async () => {
        const reason = prompt("Enter escalation reason:");
        if (!reason) return;

        const result = await escalateTicket(data.id, reason);
        if (result.success) {
            logActivity("status_change", `Ticket escalated: ${reason}`);
            router.refresh(); // Refresh page to reflect new status/priority
        }
    };

    const handleClose = async () => {
        // In reality, this would call an updateStatus action
        logActivity("status_change", "Ticket marked as resolved");
        // router.refresh();
    };

    const setAsNextAction = (id: string) => {
        const action = actions.find(a => a.id === id);
        if (!action) return;

        const isCurrentlyNext = action.isNextAction;

        setActions(prev => prev.map(a => ({
            ...a,
            isNextAction: a.id === id ? !isCurrentlyNext : false
        })));

        if (!isCurrentlyNext) {
            logActivity("log", `Marked '${action.text}' as the Next Action.`);
        } else {
            logActivity("log", `Unmarked '${action.text}' as the Next Action.`);
        }
    };

    const addAction = () => {
        if (!newActionText.trim()) return;

        const newAction = {
            id: `action-${Date.now()}`,
            text: newActionText,
            completed: false,
            isNextAction: false
        };

        setActions(prev => [...prev, newAction]);
        logActivity("log", `Added action point: ${newActionText}`, newActionNote);

        // Reset
        setNewActionText("");
        setNewActionNote("");
        setShowAddNote(false);
    };

    const confirmDelete = () => {
        if (!deletingActionId) return;

        const action = actions.find(a => a.id === deletingActionId);
        if (action) {
            setActions(prev => prev.filter(a => a.id !== deletingActionId));
            logActivity("log", `Removed action point: ${action.text}`, deleteReason);
        }

        setDeletingActionId(null);
        setDeleteReason("");
    };

    const startEditing = (action: { id: string; text: string }) => {
        setEditingActionId(action.id);
        setEditActionText(action.text);
        setEditActionReason("");
    };

    const saveEdit = () => {
        if (editingActionId) {
            const action = actions.find(a => a.id === editingActionId);
            if (action && action.text !== editActionText) {
                setActions(prev => prev.map(a =>
                    a.id === editingActionId ? { ...a, text: editActionText } : a
                ));
                logActivity("log", `Updated action point: '${action.text}' â†’ '${editActionText}'`, editActionReason);
            }
            setEditingActionId(null);
            setEditActionText("");
            setEditActionReason("");
        }
    };

    // Determine Next Action for display
    const nextAction = actions.find(a => a.isNextAction) || actions.find(a => !a.completed);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mx-auto space-y-6"
        >
            {/* Header Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{formattedTicketId}</h2>
                        <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                            data.status === "open" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                data.status === "in-progress" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                    data.status === "resolved" ? "bg-green-50 text-green-700 border-green-200" :
                                        "bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        )}>
                            {data.status.replace('-', ' ').toUpperCase()}
                        </span>
                        <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                            data.priority === "high" ? "bg-red-50 text-red-700 border-red-200" :
                                data.priority === "medium" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                    "bg-green-50 text-green-700 border-green-200"
                        )}>
                            {data.priority.toUpperCase()} Priority
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <User className="h-4 w-4" />
                            {data.contact}
                        </div>
                        <div className="flex items-center gap-1.5 capitalize">
                            {data.source === 'phone' ? <Phone className="h-4 w-4" /> :
                                data.source === 'email' ? <Mail className="h-4 w-4" /> :
                                    data.source === 'whatsapp' ? <MessageCircle className="h-4 w-4" /> :
                                        <Users className="h-4 w-4" />}
                            {data.source}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            Call: {data.duration}
                        </div>
                        <div className="flex items-center gap-1.5 capitalize">
                            {data.category === 'hardware' ? <Monitor className="h-4 w-4" /> :
                                data.category === 'software' ? <AppWindow className="h-4 w-4" /> :
                                    data.category === 'network' ? <Wifi className="h-4 w-4" /> :
                                        data.category === 'access' ? <Key className="h-4 w-4" /> :
                                            data.category === 'translation' ? <Globe className="h-4 w-4" /> :
                                                data.category === 'training' ? <GraduationCap className="h-4 w-4" /> :
                                                    data.category === 'logistics' ? <Truck className="h-4 w-4" /> :
                                                        <Tag className="h-4 w-4" />}
                            {data.category}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg border",
                        data.sentiment === "positive" ? "bg-green-50 border-green-100 text-green-700" :
                            data.sentiment === "negative" ? "bg-red-50 border-red-100 text-red-700" :
                                "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    )}>
                        {data.sentiment === "positive" ? <ThumbsUp className="h-4 w-4" /> :
                            data.sentiment === "negative" ? <ThumbsDown className="h-4 w-4" /> :
                                <div className="h-4 w-4 rounded-full border-2 border-current" />}
                        <span className="font-medium capitalize">{data.sentiment} Sentiment</span>
                    </div>
                    {data.isEscalated && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-red-50 border-red-200 text-red-700 animate-pulse">
                            <AlertCircle className="h-4 w-4" />
                            <span className="font-bold text-sm">ESCALATED</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="font-medium">Assignee:</span>
                        <div className="flex items-center gap-1.5">
                            <div className="h-5 w-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                {data.assignee.charAt(0)}
                            </div>
                            {data.assignee}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="font-medium">Time Spent:</span>
                        <span>{data.timeSpent}</span>
                    </div>

                    {(userRole === 'admin' || userRole === 'super_admin') && (
                        <div className="mt-2">
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete Ticket
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-xl border border-slate-200 dark:border-slate-800"
                    >
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">Delete Ticket?</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                            This will remove the ticket from all active views. It can be restored by an administrator if needed.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSoftDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 rounded-xl transition-colors shadow-lg shadow-red-200 dark:shadow-none flex items-center gap-2"
                            >
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Quick Insight Card */}
                    <section className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800/30">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                                <Lightbulb className="h-5 w-5" />
                            </div>
                            <div className="space-y-3 flex-1">
                                <div>
                                    <h3 className="font-semibold text-indigo-900 dark:text-indigo-300">Quick Insight</h3>
                                    <p className="text-sm text-indigo-700/80 dark:text-indigo-300/70 mt-1 leading-relaxed">
                                        {data.aiSummary || data.summary}
                                    </p>
                                    {!data.aiSummary && (
                                        <p className="text-xs text-indigo-400 mt-2 italic">AI summary pending â€” showing user description</p>
                                    )}
                                </div>
                                {nextAction && (
                                    <div className="flex items-center gap-2 text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100/50 dark:bg-indigo-900/30 px-3 py-2 rounded-lg w-fit">
                                        <ArrowRight className="h-4 w-4" />
                                        <span>Next Action: {nextAction.text}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Summary */}
                    <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                            <FileTextIcon className="h-5 w-5 text-indigo-600" />
                            {data.topic}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            {data.summary}
                        </p>
                    </section>


                    {/* Activity Log */}
                    <section className="h-[600px]">
                        <TicketActivity
                            activities={activities}
                            suggestions={data.followUpQuestions}
                            onAddActivity={handleAddActivity}
                            onEscalate={handleEscalate}
                            onClose={handleClose}
                        />
                    </section>
                </div>

                {/* Sidebar */}
                <div className="md:col-span-1 space-y-6">

                    {/* Analyze with AI Button */}
                    <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-indigo-500" />
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">AI Analysis</span>
                            </div>
                            {keyIssues.length > 0 && (
                                <span className="text-xs text-green-600 font-medium">✓ Analyzed</span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            Choose a model to generate suggested key issues, causes, and actions.
                        </p>

                        <div className="mb-4">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5 ml-1">
                                Select Model
                            </label>
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                disabled={isAnalyzing}
                                className="w-full text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 dark:text-slate-300"
                            >
                                {availableModels.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        {analyzeError && (
                            <p className="text-xs text-red-500 mb-2 px-1">{analyzeError}</p>
                        )}
                        <button
                            onClick={handleAnalyzeWithAI}
                            disabled={isAnalyzing}
                            className={cn(
                                "w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all",
                                isAnalyzing
                                    ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-400 cursor-not-allowed"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none"
                            )}
                        >
                            {isAnalyzing ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
                            ) : (
                                <><Sparkles className="h-4 w-4" /> {keyIssues.length > 0 ? "Re-analyze" : "Analyze with AI"}</>
                            )}
                        </button>
                    </section>

                    {/* Knowledge Base Suggestions */}
                    <section className="h-[320px]">
                        <KnowledgeBaseSuggestions matches={data.kbMatches} onCite={handleCiteArticle} />
                    </section>

                    {/* Suggested Key Issues — Admin CRUD */}
                    <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            Suggested Key Issues
                        </h3>
                        <ul className="space-y-2 mb-4">
                            {keyIssues.map((issue, i) => (
                                <li key={i} className="flex items-start gap-3 group">
                                    {editingIssueIdx === i ? (
                                        <div className="flex-1 flex gap-2">
                                            <input
                                                className="flex-1 text-[13px] px-2 py-1 border border-indigo-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50"
                                                value={editIssueText}
                                                onChange={e => setEditIssueText(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') { const updated = [...keyIssues]; updated[i] = editIssueText; setKeyIssues(updated); setEditingIssueIdx(null); logActivity("log", `Updated key issue #${i + 1}: "${editIssueText}"`); }
                                                    if (e.key === 'Escape') setEditingIssueIdx(null);
                                                }}
                                                autoFocus
                                            />
                                            <button onClick={() => { const updated = [...keyIssues]; updated[i] = editIssueText; setKeyIssues(updated); setEditingIssueIdx(null); logActivity("log", `Updated key issue: "${editIssueText}"`); }} className="px-2 text-[10px] bg-indigo-600 text-white rounded-lg">Save</button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="flex-shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                                            <span className="flex-1 text-slate-700 dark:text-slate-300 text-[13px] leading-snug">{issue}</span>
                                            <div className="hidden group-hover:flex gap-1">
                                                <button onClick={() => { setEditingIssueIdx(i); setEditIssueText(issue); }} className="text-[10px] text-slate-400 hover:text-indigo-600">Edit</button>
                                            </div>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-2">
                            <input
                                className="flex-1 text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400"
                                placeholder="Add key issue..."
                                value={newIssueText}
                                onChange={e => setNewIssueText(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && newIssueText.trim()) { setKeyIssues(prev => [...prev, newIssueText.trim()]); logActivity("log", `Added key issue: "${newIssueText.trim()}"`); setNewIssueText(""); } }}
                            />
                            <button
                                onClick={() => { if (newIssueText.trim()) { setKeyIssues(prev => [...prev, newIssueText.trim()]); logActivity("log", `Added key issue: "${newIssueText.trim()}"`); setNewIssueText(""); } }}
                                className="p-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                            >
                                <Plus className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </section>

                    {/* Suggested Potential Causes — Admin CRUD */}
                    <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                            <Brain className="h-4 w-4 text-purple-600" />
                            Suggested Potential Causes
                        </h3>
                        <ul className="space-y-2 mb-4">
                            {potentialCauses.map((cause, i) => (
                                <li key={i} className="flex items-start gap-3 group">
                                    {editingCauseIdx === i ? (
                                        <div className="flex-1 flex gap-2">
                                            <input
                                                className="flex-1 text-[13px] px-2 py-1 border border-indigo-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50"
                                                value={editCauseText}
                                                onChange={e => setEditCauseText(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') { const updated = [...potentialCauses]; updated[i] = editCauseText; setPotentialCauses(updated); setEditingCauseIdx(null); logActivity("log", `Updated cause #${i + 1}: "${editCauseText}"`); }
                                                    if (e.key === 'Escape') setEditingCauseIdx(null);
                                                }}
                                                autoFocus
                                            />
                                            <button onClick={() => { const updated = [...potentialCauses]; updated[i] = editCauseText; setPotentialCauses(updated); setEditingCauseIdx(null); logActivity("log", `Updated cause: "${editCauseText}"`); }} className="px-2 text-[10px] bg-indigo-600 text-white rounded-lg">Save</button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="flex-shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-purple-500" />
                                            <span className="flex-1 text-slate-700 dark:text-slate-300 text-[13px] leading-snug">{cause}</span>
                                            <div className="hidden group-hover:flex gap-1">
                                                <button onClick={() => { setEditingCauseIdx(i); setEditCauseText(cause); }} className="text-[10px] text-slate-400 hover:text-indigo-600">Edit</button>
                                            </div>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-2">
                            <input
                                className="flex-1 text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400"
                                placeholder="Add cause..."
                                value={newCauseText}
                                onChange={e => setNewCauseText(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && newCauseText.trim()) { setPotentialCauses(prev => [...prev, newCauseText.trim()]); logActivity("log", `Added cause: "${newCauseText.trim()}"`); setNewCauseText(""); } }}
                            />
                            <button
                                onClick={() => { if (newCauseText.trim()) { setPotentialCauses(prev => [...prev, newCauseText.trim()]); logActivity("log", `Added cause: "${newCauseText.trim()}"`); setNewCauseText(""); } }}
                                className="p-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                            >
                                <Plus className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </section>

                    {/* Satisfaction Rating (for resolved/closed tickets) */}
                    {(data.status === 'resolved' || data.status === 'closed') && (
                        <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="flex flex-col items-center justify-center text-center space-y-4">
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-50">How was your experience?</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Please rate the support you received for this ticket.</p>
                                </div>

                                {data.satisfactionScore ? (
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={cn(
                                                    "h-8 w-8",
                                                    star <= data.satisfactionScore!
                                                        ? "text-yellow-400 fill-yellow-400"
                                                        : "text-slate-200 dark:text-slate-700"
                                                )}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={async () => {
                                                    const res = await updateSatisfaction(data.id, star);
                                                    if (res.success) {
                                                        router.refresh();
                                                        logActivity("log", `User rated the interaction ${star}/5 stars.`);
                                                    }
                                                }}
                                                className="p-1 hover:scale-110 transition-transform focus:outline-none"
                                            >
                                                <Star className="h-8 w-8 text-slate-300 hover:text-yellow-400 hover:fill-yellow-400 transition-colors" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Agent Assist Panel */}
                    {(data.isUserSolvable !== undefined || (data.followUpQuestions && data.followUpQuestions?.length > 0)) && (
                        <section className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100 flex flex-col gap-6">
                            <div className="flex items-center gap-2 text-indigo-900 font-bold">
                                <Star className="h-5 w-5 text-indigo-600" />
                                <h2>Agent Assist</h2>
                            </div>

                            {/* User Solvable Badge */}
                            {data.isUserSolvable !== undefined && (
                                <div className={cn(
                                    "p-4 rounded-xl border border-2",
                                    data.isUserSolvable
                                        ? "bg-green-50 border-green-200 text-green-800"
                                        : "bg-amber-50 border-amber-200 text-amber-800"
                                )}>
                                    <div className="flex items-center gap-2 mb-2 font-semibold">
                                        {data.isUserSolvable ? (
                                            <>
                                                <div className="h-2 w-2 rounded-full bg-green-600" />
                                                User Solvable
                                            </>
                                        ) : (
                                            <>
                                                <div className="h-2 w-2 rounded-full bg-amber-600" />
                                                Requires Agent
                                            </>
                                        )}
                                    </div>
                                    <p className="text-sm opacity-90 leading-relaxed">
                                        {data.userSolvableReason}
                                    </p>
                                </div>
                            )}

                            {/* Follow-up Questions */}
                            {data.followUpQuestions && data.followUpQuestions?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-indigo-900 mb-3 uppercase tracking-wider">Ask the User</h3>
                                    <ul className="space-y-3">
                                        {data.followUpQuestions?.map((q, i) => (
                                            <li key={i} className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-indigo-100 text-sm text-slate-700 dark:text-slate-300">
                                                {q}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Suggested Sub-category */}
                            {data.subCategory && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="font-semibold text-indigo-900">Suggested Sub-category:</span>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                                        {data.subCategory}
                                    </span>
                                </div>
                            )}
                        </section>
                    )}

                    {/* Action Points */}
                    <section className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 h-full flex flex-col">
                        <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                            Action Points
                        </h3>
                        <div className="space-y-3 flex-1">
                            {actions.map((action) => (
                                <div
                                    key={action.id}
                                    className={cn(
                                        "group flex gap-3 items-start bg-white dark:bg-slate-900 p-3 rounded-lg shadow-sm border transition-all",
                                        action.completed ? "border-indigo-100 opacity-75" : "border-indigo-100/50 hover:border-indigo-300",
                                        deletingActionId === action.id && "border-red-200 bg-red-50",
                                        action.isNextAction && "ring-1 ring-indigo-400 border-indigo-400"
                                    )}
                                >
                                    {deletingActionId === action.id ? (
                                        <div className="flex-1 space-y-2">
                                            <p className="text-sm text-red-700 font-medium">Delete this action?</p>
                                            <input
                                                type="text"
                                                value={deleteReason}
                                                onChange={(e) => setDeleteReason(e.target.value)}
                                                placeholder="Reason (optional)"
                                                className="w-full text-xs p-2 rounded border border-red-200 focus:outline-none focus:border-red-400"
                                                autoFocus
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => setDeletingActionId(null)}
                                                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 px-2 py-1"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={confirmDelete}
                                                    className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex-shrink-0 mt-0.5 flex flex-col gap-2">
                                                <button
                                                    onClick={() => toggleAction(action.id)}
                                                    className={cn(
                                                        "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors",
                                                        action.completed
                                                            ? "bg-indigo-600 border-indigo-600 text-white"
                                                            : "border-indigo-200 hover:border-indigo-400 bg-white dark:bg-slate-900"
                                                    )}
                                                >
                                                    {action.completed && <CheckCircle2 className="h-3.5 w-3.5" />}
                                                </button>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                {editingActionId === action.id ? (
                                                    <div className="space-y-2">
                                                        <input
                                                            type="text"
                                                            value={editActionText}
                                                            onChange={(e) => setEditActionText(e.target.value)}
                                                            className="w-full text-sm border-b border-indigo-300 focus:outline-none focus:border-indigo-600 bg-transparent"
                                                            autoFocus
                                                        />
                                                        <input
                                                            type="text"
                                                            value={editActionReason}
                                                            onChange={(e) => setEditActionReason(e.target.value)}
                                                            placeholder="Reason for change (optional)"
                                                            className="w-full text-xs text-slate-500 dark:text-slate-400 border-b border-indigo-100 focus:outline-none focus:border-indigo-400 bg-transparent"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') saveEdit();
                                                                if (e.key === 'Escape') setEditingActionId(null);
                                                            }}
                                                        />
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => setEditingActionId(null)} className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-400">Cancel</button>
                                                            <button onClick={saveEdit} className="text-xs text-green-600 font-medium">Save</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span
                                                        onClick={() => startEditing(action)}
                                                        className={cn(
                                                            "text-sm font-medium cursor-text block truncate",
                                                            action.completed ? "text-slate-400 line-through" : "text-indigo-900"
                                                        )}
                                                        title={action.text}
                                                    >
                                                        {action.text}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setAsNextAction(action.id)}
                                                    className={cn(
                                                        "text-xs p-1 rounded hover:bg-indigo-50",
                                                        action.isNextAction ? "text-amber-500 opacity-100" : "text-slate-300 hover:text-amber-500"
                                                    )}
                                                    title={action.isNextAction ? "Unmark as Next Action" : "Mark as Next Action"}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={action.isNextAction ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setDeletingActionId(action.id)}
                                                    className="text-slate-300 hover:text-red-500 p-1 rounded hover:bg-red-50"
                                                    title="Delete Action"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}

                            {/* Add New Action */}
                            <div className="mt-2 pt-2 border-t border-indigo-100/50 space-y-2">
                                <div className="flex gap-2 items-center">
                                    <Plus className="h-4 w-4 text-indigo-400" />
                                    <input
                                        type="text"
                                        value={newActionText}
                                        onChange={(e) => setNewActionText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addAction()}
                                        placeholder="Add new action..."
                                        className="flex-1 bg-transparent text-sm placeholder:text-indigo-300 focus:outline-none text-indigo-900"
                                    />
                                    {newActionText && (
                                        <button
                                            onClick={() => setShowAddNote(!showAddNote)}
                                            className={cn(
                                                "text-xs font-medium transition-colors",
                                                showAddNote ? "text-indigo-600" : "text-slate-400 hover:text-indigo-600"
                                            )}
                                        >
                                            {showAddNote ? "- Note" : "+ Note"}
                                        </button>
                                    )}
                                    {newActionText && (
                                        <button
                                            onClick={addAction}
                                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                                        >
                                            Add
                                        </button>
                                    )}
                                </div>
                                {showAddNote && newActionText && (
                                    <input
                                        type="text"
                                        value={newActionNote}
                                        onChange={(e) => setNewActionNote(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addAction()}
                                        placeholder="Add an optional note..."
                                        className="w-full text-xs pl-6 bg-transparent placeholder:text-indigo-200 focus:outline-none text-indigo-800"
                                    />
                                )}
                            </div>
                        </div>

                        <button className="w-full mt-6 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
                            <Copy className="h-4 w-4" />
                            Copy to Clipboard
                        </button>
                    </section>
                </div>
            </div>
        </motion.div >
    );
}
