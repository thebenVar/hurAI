"use client";

import { useState, useEffect } from "react";
import { TicketData } from "./TicketDashboard";
import {
    X,
    Save,
    Monitor,
    AppWindow,
    Wifi,
    Key,
    Globe,
    GraduationCap,
    Truck,
    Tag,
    Star,
    Clock,
    User,
    MessageCircle,
    Phone,
    Mail,
    Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ManualTicketFormProps {
    onSubmit: (data: TicketData) => void;
    onCancel: () => void;
    initialData?: {
        contact?: string;
        summary?: string;
        source?: "phone" | "email" | "whatsapp" | "in-person" | "other";
        // AI Pre-fill data
        category?: TicketData['category'];
        subCategory?: string;
        priority?: TicketData['priority'];
        sentiment?: TicketData['sentiment'];
        keyIssues?: string[];
        potentialCauses?: string[];
        actionPoints?: string[];
        isUserSolvable?: boolean;
        userSolvableReason?: string;
        followUpQuestions?: string[];
    };
}

export function ManualTicketForm({ onSubmit, onCancel, initialData }: ManualTicketFormProps) {
    const [formData, setFormData] = useState<Partial<TicketData>>({
        id: "INC-PENDING", // Stable initial value to prevent hydration mismatch
        contact: initialData?.contact || "",
        source: initialData?.source || "phone",
        duration: "0m 0s",
        topic: "",
        sentiment: "neutral",
        priority: "medium",
        summary: initialData?.summary || "",
        keyIssues: initialData?.keyIssues || [],
        potentialCauses: initialData?.potentialCauses || [],
        actionPoints: initialData?.actionPoints ? initialData.actionPoints.map((text, i) => ({
            id: `action-${i}`, text, completed: false, isNextAction: false
        })) : [],
        assignee: "Unassigned",
        status: "open",
        category: initialData?.category || "other",
        subCategory: initialData?.subCategory || "",
        isUserSolvable: initialData?.isUserSolvable || false,
        userSolvableReason: initialData?.userSolvableReason || "",
        followUpQuestions: initialData?.followUpQuestions || [],
        timeSpent: "0m",
        activityLog: [],
        kbMatches: []
    });

    // Generate ID on client side only
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            id: `INC-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`
        }));
    }, []);

    const [tempIssues, setTempIssues] = useState(initialData?.keyIssues?.map(i => `- ${i}`).join('\n') || "");
    const [tempCauses, setTempCauses] = useState(initialData?.potentialCauses?.map(c => `- ${c}`).join('\n') || "");
    const [tempActions, setTempActions] = useState(initialData?.actionPoints?.map(a => `- ${a}`).join('\n') || "");

    // Update state when initialData changes (e.g. from async Server Action)
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                contact: initialData.contact || prev.contact,
                source: initialData.source || prev.source,
                summary: initialData.summary || prev.summary,
                keyIssues: initialData.keyIssues || prev.keyIssues,
                potentialCauses: initialData.potentialCauses || prev.potentialCauses,
                actionPoints: initialData.actionPoints ? initialData.actionPoints.map((text, i) => ({
                    id: `action-${i}`, text, completed: false, isNextAction: false
                })) : prev.actionPoints,
                category: initialData.category || prev.category,
                subCategory: initialData.subCategory || prev.subCategory,
                isUserSolvable: initialData.isUserSolvable ?? prev.isUserSolvable,
                userSolvableReason: initialData.userSolvableReason || prev.userSolvableReason,
                followUpQuestions: initialData.followUpQuestions || prev.followUpQuestions,
                priority: initialData.priority || prev.priority,
                sentiment: initialData.sentiment || prev.sentiment,
            }));

            if (initialData.keyIssues) setTempIssues(initialData.keyIssues.map(i => `- ${i}`).join('\n'));
            if (initialData.potentialCauses) setTempCauses(initialData.potentialCauses.map(c => `- ${c}`).join('\n'));
            if (initialData.actionPoints) setTempActions(initialData.actionPoints.map(a => `- ${a}`).join('\n'));
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Process textareas into arrays
        const processList = (text: string) => text.split('\n').filter(line => line.trim() !== '');

        const finalData: TicketData = {
            id: formData.id || "INC-UNKNOWN",
            contact: formData.contact || "Unknown Contact",
            source: formData.source as any || "other",
            duration: formData.duration || "0m 0s",
            topic: formData.topic || "General Inquiry",
            sentiment: formData.sentiment as "positive" | "neutral" | "negative",
            priority: formData.priority as "low" | "medium" | "high",
            summary: formData.summary || "No summary provided.",
            keyIssues: processList(tempIssues),
            potentialCauses: processList(tempCauses),
            actionPoints: processList(tempActions).map((action, i) => ({
                id: `action-${Date.now()}-${i}`,
                text: action,
                completed: false,
                isNextAction: false
            })),
            assignee: formData.assignee || "Unassigned",
            status: formData.status as any || "open",
            category: formData.category as any || "other",
            timeSpent: formData.timeSpent || "0m",
            subCategory: formData.subCategory,
            isUserSolvable: formData.isUserSolvable,
            userSolvableReason: formData.userSolvableReason,
            followUpQuestions: formData.followUpQuestions,
            activityLog: [],
            kbMatches: []
        };

        onSubmit(finalData);
    };

    const categories = [
        { id: "translation", label: "Translation", icon: Globe, color: "text-blue-600 bg-blue-50 border-blue-200" },
        { id: "training", label: "Training", icon: GraduationCap, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
        { id: "logistics", label: "Logistics", icon: Truck, color: "text-amber-600 bg-amber-50 border-amber-200" },
        { id: "software", label: "Software", icon: AppWindow, color: "text-purple-600 bg-purple-50 border-purple-200" },
        { id: "hardware", label: "Hardware", icon: Monitor, color: "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" },
        { id: "network", label: "Network", icon: Wifi, color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
        { id: "access", label: "Access", icon: Key, color: "text-rose-600 bg-rose-50 border-rose-200" },
        { id: "other", label: "Other", icon: Tag, color: "text-gray-600 bg-gray-50 border-gray-200" },
    ];

    return (
        <div className="w-full max-w-7xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col md:flex-row h-[85vh]">
            {/* Sidebar - Meta Data */}
            <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 p-6 flex flex-col gap-8 overflow-y-auto shrink-0">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-6">New Ticket</h2>

                    <div className="space-y-6">
                        {/* Status */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</label>
                            <div className="flex flex-wrap gap-2">
                                {["open", "in-progress", "resolved", "closed"].map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: s as any })}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-all",
                                            formData.status === s
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-indigo-400"
                                        )}
                                    >
                                        {s.replace("-", " ")}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Priority */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Priority</label>
                            <div className="flex gap-2 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                {["low", "medium", "high"].map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, priority: p as any })}
                                        className={cn(
                                            "flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all",
                                            formData.priority === p
                                                ? p === "high" ? "bg-red-100 text-red-700 shadow-sm" :
                                                    p === "medium" ? "bg-amber-100 text-amber-700 shadow-sm" :
                                                        "bg-green-100 text-green-700 shadow-sm"
                                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800"
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sentiment */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Customer Sentiment</label>
                            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                {["negative", "neutral", "positive"].map((s, idx) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, sentiment: s as any })}
                                        className={cn(
                                            "p-2 rounded-full transition-all hover:scale-110",
                                            formData.sentiment === s
                                                ? s === "positive" ? "bg-green-100 text-green-600 ring-2 ring-green-500 ring-offset-2" :
                                                    s === "negative" ? "bg-red-100 text-red-600 ring-2 ring-red-500 ring-offset-2" :
                                                        "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-2 ring-slate-500 ring-offset-2"
                                                : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50"
                                        )}
                                    >
                                        {s === "positive" ? "😊" : s === "negative" ? "😠" : "😐"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Assignee */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Assignee</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400"
                                    placeholder="Assign to..."
                                    value={formData.assignee}
                                    onChange={e => setFormData({ ...formData, assignee: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Time Spent */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Time Spent</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400"
                                    placeholder="e.g. 15m"
                                    value={formData.timeSpent}
                                    onChange={e => setFormData({ ...formData, timeSpent: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:bg-slate-900 hover:shadow-sm rounded-xl border border-transparent hover:border-slate-200 dark:border-slate-700 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]"
                    >
                        <Save className="h-4 w-4" />
                        Create
                    </button>
                </div>
            </div>

            {/* Agent Assist Panel (New) */}
            {(formData.isUserSolvable !== undefined || (formData.followUpQuestions && formData.followUpQuestions.length > 0)) && (
                <div className="hidden lg:flex w-72 bg-indigo-50/50 border-r border-slate-200 dark:border-slate-700 p-6 flex-col gap-6 shrink-0">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold">
                        <Star className="h-5 w-5 text-indigo-600" />
                        <h2>Agent Assist</h2>
                    </div>

                    {/* User Solvable Badge */}
                    {formData.isUserSolvable !== undefined && (
                        <div className={cn(
                            "p-4 rounded-xl border border-2",
                            formData.isUserSolvable
                                ? "bg-green-50 border-green-200 text-green-800"
                                : "bg-amber-50 border-amber-200 text-amber-800"
                        )}>
                            <div className="flex items-center gap-2 mb-2 font-semibold">
                                {formData.isUserSolvable ? (
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
                                {formData.userSolvableReason}
                            </p>
                        </div>
                    )}

                    {/* Follow-up Questions */}
                    {formData.followUpQuestions && formData.followUpQuestions.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-indigo-900 mb-3 uppercase tracking-wider">Ask the User</h3>
                            <ul className="space-y-3">
                                {formData.followUpQuestions.map((q, i) => (
                                    <li key={i} className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-indigo-100 text-sm text-slate-700 dark:text-slate-300">
                                        {q}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto bg-white dark:bg-slate-900">
                <div className="max-w-3xl mx-auto space-y-8">
                    {/* Contact & Source */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contact Name</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:bg-slate-900 text-lg font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400"
                                placeholder="Who is calling?"
                                value={formData.contact}
                                onChange={e => setFormData({ ...formData, contact: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Source</label>
                            <div className="flex gap-2">
                                {["phone", "email", "whatsapp", "other"].map((src) => (
                                    <button
                                        key={src}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, source: src as any })}
                                        className={cn(
                                            "flex-1 py-3 rounded-xl border transition-all flex items-center justify-center",
                                            formData.source === src
                                                ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                                                : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-indigo-300 hover:text-indigo-600"
                                        )}
                                        title={src}
                                    >
                                        {src === "phone" ? <Phone className="h-5 w-5" /> :
                                            src === "email" ? <Mail className="h-5 w-5" /> :
                                                src === "whatsapp" ? <MessageCircle className="h-5 w-5" /> :
                                                    <Users className="h-5 w-5" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Category Grid */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: cat.id as any })}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all hover:scale-[1.02]",
                                        formData.category === cat.id
                                            ? cn("ring-2 ring-offset-2 ring-indigo-500", cat.color)
                                            : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200"
                                    )}
                                >
                                    <cat.icon className="h-6 w-6" />
                                    <span className="text-xs font-medium">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                        {formData.subCategory && (
                            <div className="mt-3 flex items-center gap-2">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Suggested Sub-category:</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                    {formData.subCategory}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Topic & Summary */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Topic</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400"
                                placeholder="What is this about?"
                                value={formData.topic}
                                onChange={e => setFormData({ ...formData, topic: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Summary</label>
                            <textarea
                                required
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400"
                                placeholder="Describe the issue in detail..."
                                value={formData.summary}
                                onChange={e => setFormData({ ...formData, summary: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Key Issues</label>
                            <textarea
                                rows={4}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400"
                                placeholder="- Issue 1..."
                                value={tempIssues}
                                onChange={e => setTempIssues(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Potential Causes</label>
                            <textarea
                                rows={4}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400"
                                placeholder="- Cause 1..."
                                value={tempCauses}
                                onChange={e => setTempCauses(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Action Points</label>
                            <textarea
                                rows={4}
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400"
                                placeholder="- Action 1..."
                                value={tempActions}
                                onChange={e => setTempActions(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
