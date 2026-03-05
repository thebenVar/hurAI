"use client";

import { useState } from "react";
import {
    MessageSquare,
    Phone,
    FileText,
    Terminal,
    CheckCircle2,
    AlertCircle,
    Paperclip,
    Send,
    MoreHorizontal,
    Clock,
    User
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActivityItem {
    id: string;
    type: "call" | "message" | "file" | "log" | "status_change" | "note";
    author: string;
    avatar?: string; // URL or initials
    timestamp: string;
    content: string;
    metadata?: {
        duration?: string;
        fileUrl?: string;
        fileType?: string;
        oldStatus?: string;
        newStatus?: string;
    };
}

interface TicketActivityProps {
    activities: ActivityItem[];
    onAddActivity: (type: string, content: string) => void;
}

export function TicketActivity({ activities, onAddActivity }: TicketActivityProps) {
    const [newMessage, setNewMessage] = useState("");

    const handleSend = () => {
        if (!newMessage.trim()) return;
        onAddActivity("message", newMessage);
        setNewMessage("");
    };

    const getIcon = (type: ActivityItem["type"]) => {
        switch (type) {
            case "call": return <Phone className="h-4 w-4" />;
            case "message": return <MessageSquare className="h-4 w-4" />;
            case "file": return <Paperclip className="h-4 w-4" />;
            case "log": return <Terminal className="h-4 w-4" />;
            case "status_change": return <CheckCircle2 className="h-4 w-4" />;
            case "note": return <FileText className="h-4 w-4" />;
            default: return <AlertCircle className="h-4 w-4" />;
        }
    };

    const getColors = (type: ActivityItem["type"]) => {
        switch (type) {
            case "call": return "bg-blue-100 text-blue-600 border-blue-200";
            case "message": return "bg-indigo-100 text-indigo-600 border-indigo-200";
            case "file": return "bg-amber-100 text-amber-600 border-amber-200";
            case "log": return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
            case "status_change": return "bg-green-100 text-green-600 border-green-200";
            case "note": return "bg-yellow-50 text-yellow-600 border-yellow-200";
            default: return "bg-gray-100 text-gray-600 border-gray-200";
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    Activity Log
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium px-2 py-1 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700">
                    {activities.length} Events
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />

                    {activities.map((activity, index) => (
                        <div key={activity.id} className="relative pl-12 mb-8 last:mb-0 group">
                            {/* Icon Bubble */}
                            <div className={cn(
                                "absolute left-0 top-0 h-10 w-10 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10",
                                getColors(activity.type)
                            )}>
                                {getIcon(activity.type)}
                            </div>

                            {/* Content Card */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-900 dark:text-slate-50 text-sm">{activity.author}</span>
                                        <span className="text-xs text-slate-400">• {activity.timestamp}</span>
                                    </div>
                                    <button className="text-slate-400 hover:text-slate-600 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                </div>

                                {activity.type === 'log' ? (
                                    <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-300 overflow-x-auto">
                                        <code>{activity.content}</code>
                                    </div>
                                ) : activity.type === 'status_change' ? (
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <span>Changed status from</span>
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium border border-slate-200 dark:border-slate-700">
                                            {activity.metadata?.oldStatus?.toUpperCase()}
                                        </span>
                                        <span>to</span>
                                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium border border-green-200">
                                            {activity.metadata?.newStatus?.toUpperCase()}
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                                        {activity.content}
                                    </p>
                                )}

                                {activity.metadata?.fileUrl && (
                                    <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                        <div className="h-8 w-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">Attached File</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{activity.metadata.fileType}</p>
                                        </div>
                                        <a href="#" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">Download</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Reply or add a note..."
                            className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none text-sm shadow-sm"
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />
                        <button
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                            <Paperclip className="h-4 w-4" />
                        </button>
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={!newMessage.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-indigo-200 flex items-center gap-2"
                    >
                        <Send className="h-4 w-4" />
                        <span className="hidden sm:inline">Send</span>
                    </button>
                </div>
                <div className="flex gap-4 mt-3 px-1">
                    <button className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 flex items-center gap-1.5 transition-colors">
                        <User className="h-3.5 w-3.5" />
                        Assign
                    </button>
                    <button className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 flex items-center gap-1.5 transition-colors">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Close Ticket
                    </button>
                    <button className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 flex items-center gap-1.5 transition-colors">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Escalate
                    </button>
                </div>
            </div>
        </div>
    );
}
