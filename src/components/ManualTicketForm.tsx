"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react"; import { TicketData } from "./TicketDashboard";
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
    Globe2,
    Users,
    Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ManualTicketFormProps {
    onSubmit: (data: TicketData) => void;
    onCancel: () => void;
    initialData?: {
        contact?: string;
        summary?: string;
        source?: "phone" | "email" | "whatsapp" | "in-person" | "web" | "other";
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
    const { data: session } = useSession();
    const sessionName = session?.user?.name || session?.user?.email || "";
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState<Partial<TicketData>>({
        id: "INC-PENDING",
        contact: initialData?.contact || sessionName,
        source: initialData?.source || "web",
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

    // Once session loads, auto-fill contact if not already set
    useEffect(() => {
        if (sessionName && !formData.contact) {
            setFormData(prev => ({ ...prev, contact: sessionName }));
        }
    }, [sessionName]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

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

        try {
            await onSubmit(finalData);
        } finally {
            setIsSubmitting(false);
        }
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
        <div className="w-full max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[85vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Create Ticket</h2>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:bg-slate-900 hover:shadow-sm rounded-xl border border-transparent hover:border-slate-200 dark:border-slate-700 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={cn(
                            "flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-xl shadow-md transition-all",
                            isSubmitting
                                ? "bg-indigo-400 cursor-not-allowed shadow-none"
                                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:scale-[1.02]"
                        )}
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Submit Request
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10">

                {/* Agent Assist Panel (If Applicable) */}
                {(formData.isUserSolvable !== undefined || (formData.followUpQuestions && formData.followUpQuestions.length > 0)) && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-2xl p-6 flex flex-col gap-6">
                        <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-bold">
                            <Star className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            <h2>Agent Assist (Suggestions)</h2>
                        </div>

                        {formData.isUserSolvable !== undefined && (
                            <div className={cn(
                                "p-4 rounded-xl border",
                                formData.isUserSolvable
                                    ? "bg-green-50/80 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800/30 dark:text-green-300"
                                    : "bg-amber-50/80 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800/30 dark:text-amber-300"
                            )}>
                                <div className="flex items-center gap-2 mb-2 font-semibold">
                                    {formData.isUserSolvable ? (
                                        <>
                                            <div className="h-2 w-2 rounded-full bg-green-600" />
                                            Self-Resolution Possible
                                        </>
                                    ) : (
                                        <>
                                            <div className="h-2 w-2 rounded-full bg-amber-600" />
                                            Agent Assistance Required
                                        </>
                                    )}
                                </div>
                                <p className="text-sm opacity-90 leading-relaxed">
                                    {formData.userSolvableReason}
                                </p>
                            </div>
                        )}

                        {formData.followUpQuestions && formData.followUpQuestions.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-3 uppercase tracking-wider">Suggested Questions to Answer</h3>
                                <ul className="space-y-3">
                                    {formData.followUpQuestions.map((q, i) => (
                                        <li key={i} className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-800/30 text-sm text-slate-700 dark:text-slate-300">
                                            {q}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Form Fields Section */}
                <div className="space-y-8">
                    {/* Contact & Source */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Contact — read-only, from session */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Submitted By</label>
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-semibold text-sm shrink-0">
                                    {(formData.contact || "?")[0].toUpperCase()}
                                </div>
                                <span className="text-slate-900 dark:text-slate-100 font-medium text-sm truncate">
                                    {formData.contact || "Loading..."}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Submission Channel</label>
                            <div className="flex gap-2">
                                {(["web", "phone", "email", "whatsapp"] as const).map((src) => (
                                    <button
                                        key={src}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, source: src as any })}
                                        className={cn(
                                            "flex-1 py-3 rounded-xl border transition-all flex items-center justify-center",
                                            formData.source === src
                                                ? "bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/40 dark:border-indigo-700 dark:text-indigo-300"
                                                : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-indigo-300 hover:text-indigo-600"
                                        )}
                                        title={src}
                                    >
                                        {src === "web" ? <Globe2 className="h-5 w-5" /> :
                                            src === "phone" ? <Phone className="h-5 w-5" /> :
                                                src === "email" ? <Mail className="h-5 w-5" /> :
                                                    <MessageCircle className="h-5 w-5" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Topic & Summary */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Topic</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400"
                                placeholder="Briefly describe the issue"
                                value={formData.topic}
                                onChange={e => setFormData({ ...formData, topic: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Summary (Details)</label>
                            <textarea
                                required
                                rows={5}
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400"
                                placeholder="Provide as much detail as possible..."
                                value={formData.summary}
                                onChange={e => setFormData({ ...formData, summary: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Category Selection */}
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
                                            ? cn("ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900", cat.color)
                                            : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200"
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
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                                    {formData.subCategory}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Media Uploads */}
                    <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Attachments & Media</label>
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center text-center hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 transition-all group">
                            <div className="h-12 w-12 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <span className="text-slate-400 group-hover:text-indigo-500">📁</span>
                            </div>
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Click to upload or drag & drop</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">SVG, PNG, JPG, MP3, MP4 or PDF (max. 10MB)</p>
                            <input
                                type="file"
                                multiple
                                className="block w-full max-w-xs text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/40 dark:file:text-indigo-300 cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Technical Suggestions (Hidden by default, shown if AI generated data) */}
                    {(tempIssues || tempCauses || tempActions) && (
                        <div className="space-y-6 pt-8 border-t border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-500" />
                                AI Suggestions (Optional)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Suggested Key Issues</label>
                                    <textarea
                                        rows={4}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900"
                                        placeholder="- Issue 1..."
                                        value={tempIssues}
                                        onChange={e => setTempIssues(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Suggested Causes</label>
                                    <textarea
                                        rows={4}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900"
                                        placeholder="- Cause 1..."
                                        value={tempCauses}
                                        onChange={e => setTempCauses(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Suggested Actions</label>
                                    <textarea
                                        rows={4}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900"
                                        placeholder="- Action 1..."
                                        value={tempActions}
                                        onChange={e => setTempActions(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
