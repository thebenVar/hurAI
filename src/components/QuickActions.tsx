"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Upload, Ticket, Send, Mic, Image as ImageIcon, Video, MonitorPlay } from "lucide-react";

interface QuickActionsProps {
    onAddMessage: (text: string, type: "text" | "voice" | "image" | "video") => void;
}

export function QuickActions({ onAddMessage }: QuickActionsProps) {
    const [quickLogText, setQuickLogText] = useState("");

    const handleQuickLog = (type: "text" | "voice" | "image" | "video" = "text") => {
        if (type === "text" && !quickLogText.trim()) return;

        onAddMessage(type === "text" ? quickLogText : "", type);
        setQuickLogText("");
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-4">Quick Actions</h3>

            {/* Quick Log Input */}
            <div className="mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Quick log..."
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={quickLogText}
                        onChange={(e) => setQuickLogText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuickLog('text')}
                    />
                    <button
                        onClick={() => handleQuickLog('text')}
                        disabled={!quickLogText.trim()}
                        className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={() => handleQuickLog('voice')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 hover:text-indigo-600 transition-colors"
                    >
                        <Mic className="h-3.5 w-3.5" />
                        Voice
                    </button>
                    <button
                        onClick={() => handleQuickLog('image')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 hover:text-indigo-600 transition-colors"
                    >
                        <ImageIcon className="h-3.5 w-3.5" />
                        Image
                    </button>
                    <button
                        onClick={() => handleQuickLog('video')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 hover:text-indigo-600 transition-colors"
                    >
                        <Video className="h-3.5 w-3.5" />
                        Video
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                <Link
                    href="/tickets/create?view=manual-entry"
                    className="flex items-center gap-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 transition-all group"
                >
                    <div className="h-10 w-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Plus className="h-6 w-6" />
                    </div>
                    <div>
                        <span className="block font-semibold text-indigo-900">Open a Ticket</span>
                        <span className="text-xs text-indigo-600/80">Walk-in, Phone, or Other</span>
                    </div>
                </Link>

                <Link
                    href="/tickets/create"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:border-slate-700 transition-all group"
                >
                    <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Upload Call Recording</span>
                </Link>

                <Link
                    href="/tickets/create"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group"
                >
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MonitorPlay className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Screen Share Session</span>
                </Link>

                <Link
                    href="/tickets"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:border-slate-700 transition-all group"
                >
                    <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Ticket className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">View My Tickets</span>
                </Link>
            </div>
        </div>
    );
}
