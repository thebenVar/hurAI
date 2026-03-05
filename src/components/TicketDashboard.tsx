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
    Star
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TicketActivity, ActivityItem } from "./TicketActivity";
import { KnowledgeBaseSuggestions, KBArticle } from "./KnowledgeBaseSuggestions";

export interface TicketData {
    id: string;
    contact: string;
    source: "phone" | "email" | "whatsapp" | "in-person" | "other";
    duration: string;
    topic: string;
    sentiment: "positive" | "neutral" | "negative";
    priority: "low" | "medium" | "high";
    summary: string;
    keyIssues: string[];
    actionPoints: { id: string; text: string; completed: boolean; isNextAction?: boolean }[];
    potentialCauses: string[];
    // New attributes
    subCategory?: string;
    isUserSolvable?: boolean;
    userSolvableReason?: string;
    followUpQuestions?: string[];

    assignee: string;
    status: "open" | "in-progress" | "resolved" | "closed";
    category: "hardware" | "software" | "network" | "access" | "translation" | "training" | "logistics" | "other";
    timeSpent: string;
    activityLog: ActivityItem[];
    kbMatches: KBArticle[];
}

export function TicketDashboard({ data }: { data: TicketData }) {
    // Local state
    const [actions, setActions] = useState(data.actionPoints);
    const [activities, setActivities] = useState(data.activityLog);

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
    const logActivity = (type: ActivityItem["type"], content: string, note?: string) => {
        const newActivity: ActivityItem = {
            id: `act-${Date.now()}`,
            type,
            author: "You", // In real app, current user
            timestamp: "Just now",
            content: note ? `${content}\n\nNote: ${note}` : content
        };
        setActivities(prev => [newActivity, ...prev]);
    };

    // Mock handler for adding activity from the Activity Log component
    const handleAddActivity = (type: string, content: string) => {
        logActivity(type as ActivityItem["type"], content);
    };

    const handleCiteArticle = (article: KBArticle) => {
        logActivity("note", `Suggested reference: ${article.title} (${article.url})`);
    };

    // Action Point Handlers
    const toggleAction = (id: string) => {
        setActions(prev => prev.map(a => {
            if (a.id === id) {
                const newCompleted = !a.completed;
                logActivity("status_change", `Marked action point '${a.text}' as ${newCompleted ? "completed" : "incomplete"}`);
                return { ...a, completed: newCompleted };
            }
            return a;
        }));
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
                logActivity("log", `Updated action point: '${action.text}' → '${editActionText}'`, editActionReason);
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
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Ticket #{data.id}</h2>
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
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Quick Insight Card */}
                    <section className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
                                <Lightbulb className="h-5 w-5" />
                            </div>
                            <div className="space-y-3 flex-1">
                                <div>
                                    <h3 className="font-semibold text-indigo-900">Quick Insight</h3>
                                    <p className="text-sm text-indigo-700/80 mt-1 leading-relaxed">
                                        {data.summary}
                                    </p>
                                </div>
                                {nextAction && (
                                    <div className="flex items-center gap-2 text-sm font-medium text-indigo-700 bg-indigo-100/50 px-3 py-2 rounded-lg w-fit">
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

                    {/* Key Issues & Causes */}
                    <div className="grid grid-cols-1 gap-6">
                        <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-amber-600" />
                                Key Issues Identified
                            </h3>
                            <ul className="space-y-3">
                                {data.keyIssues.map((issue, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                                        <span className="flex-shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                                        {issue}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                                <BrainIcon className="h-5 w-5 text-purple-600" />
                                Potential Causes
                            </h3>
                            <ul className="space-y-3">
                                {data.potentialCauses.map((cause, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                                        <span className="flex-shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-purple-500" />
                                        {cause}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {/* Activity Log */}
                        <section>
                            <TicketActivity activities={activities} onAddActivity={handleAddActivity} />
                        </section>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Knowledge Base Suggestions */}
                    <section className="h-[400px]">
                        <KnowledgeBaseSuggestions matches={data.kbMatches} onCite={handleCiteArticle} />
                    </section>

                    {/* Agent Assist Panel */}
                    {(data.isUserSolvable !== undefined || (data.followUpQuestions && data.followUpQuestions.length > 0)) && (
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
                            {data.followUpQuestions && data.followUpQuestions.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-indigo-900 mb-3 uppercase tracking-wider">Ask the User</h3>
                                    <ul className="space-y-3">
                                        {data.followUpQuestions.map((q, i) => (
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
        </motion.div>
    );
}

function FileTextIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );
}

function BrainIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
    );
}
