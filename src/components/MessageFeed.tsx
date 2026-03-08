"use client";

import { MessageCircle, Mail, ArrowRight, X, Send, Hash, Phone, Globe } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface IncomingMessage {
    id: string;
    sender: string;
    text: string;
    platform: string;
    timestamp: string;
    avatarColor: string;
    type?: "text" | "voice" | "image" | "video";
    aiSummary?: string | null;
    aiUrgency?: string | null;
}

interface MessageFeedProps {
    messages: IncomingMessage[];
    onDismiss: (id: string) => void;
}

export function MessageFeed({ messages, onDismiss }: MessageFeedProps) {
    if (messages.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-3">
                    <MessageCircle className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="font-medium text-slate-900 dark:text-slate-50">All caught up!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">No new messages in the inbox.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50">Live Inbox</h3>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                        {messages.length}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Monitoring</span>
                </div>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
                {messages.map((msg) => (
                    <div key={msg.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-colors group relative">
                        <div className="flex gap-4">
                            <div className={cn("h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm relative", msg.avatarColor)}>
                                <span className="font-semibold text-sm">{msg.sender.charAt(0)}</span>
                                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm z-10">
                                    {msg.platform === 'whatsapp' ? (
                                        <div className="bg-green-500 rounded-full p-1">
                                            <MessageCircle className="h-2.5 w-2.5 text-white" />
                                        </div>
                                    ) : msg.platform === 'email' ? (
                                        <div className="bg-blue-500 rounded-full p-1">
                                            <Mail className="h-2.5 w-2.5 text-white" />
                                        </div>
                                    ) : msg.platform === 'slack' ? (
                                        <div className="bg-purple-500 rounded-full p-1">
                                            <Hash className="h-2.5 w-2.5 text-white" />
                                        </div>
                                    ) : msg.platform === 'telegram' ? (
                                        <div className="bg-sky-500 rounded-full p-1">
                                            <Send className="h-2.5 w-2.5 text-white" />
                                        </div>
                                    ) : msg.platform === 'voice' ? (
                                        <div className="bg-amber-500 rounded-full p-1">
                                            <Phone className="h-2.5 w-2.5 text-white" />
                                        </div>
                                    ) : (
                                        <div className="bg-slate-500 rounded-full p-1">
                                            <Globe className="h-2.5 w-2.5 text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate pr-8">{msg.sender}</h4>
                                    <span className="text-xs text-slate-400 whitespace-nowrap">{msg.timestamp}</span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                                    {msg.type === 'voice' && <span className="italic text-slate-500 dark:text-slate-400">🎤 Voice Note: </span>}
                                    {msg.type === 'image' && <span className="italic text-slate-500 dark:text-slate-400">🖼️ Image: </span>}
                                    {msg.type === 'video' && <span className="italic text-slate-500 dark:text-slate-400">🎥 Video: </span>}
                                    {msg.aiSummary || msg.text}
                                </p>
                                {msg.aiUrgency && (
                                    <span className={cn(
                                        "inline-flex items-center text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full mt-1",
                                        msg.aiUrgency === 'high' ? 'bg-red-100 text-red-700' :
                                            msg.aiUrgency === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                'bg-green-100 text-green-700'
                                    )}>
                                        {msg.aiUrgency}
                                    </span>
                                )}

                                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <Link
                                        href={{
                                            pathname: '/tickets/create',
                                            query: {
                                                source: msg.platform === 'internal' ? 'in-person' : msg.platform,
                                                contact: msg.sender === 'You' ? '' : msg.sender,
                                                description: msg.text,
                                                view: 'manual-entry'
                                            }
                                        }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                                    >
                                        Convert to Ticket
                                        <ArrowRight className="h-3 w-3" />
                                    </Link>
                                    <button
                                        onClick={() => onDismiss(msg.id)}
                                        className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-colors"
                                    >
                                        Mark as Read
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => onDismiss(msg.id)}
                            className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
