"use client";

import {
    Book,
    MessageSquare,
    HelpCircle,
    ExternalLink,
    Quote,
    FileText,
    Users
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface KBArticle {
    id: string;
    title: string;
    excerpt: string;
    source: "documentation" | "previous_ticket" | "forum" | "help_system";
    url: string;
    relevance: number; // 0-100%
}

interface KnowledgeBaseSuggestionsProps {
    matches: KBArticle[];
    onCite: (article: KBArticle) => void;
}

export function KnowledgeBaseSuggestions({ matches, onCite }: KnowledgeBaseSuggestionsProps) {
    const getIcon = (source: KBArticle["source"]) => {
        switch (source) {
            case "documentation": return <Book className="h-4 w-4" />;
            case "previous_ticket": return <FileText className="h-4 w-4" />;
            case "forum": return <Users className="h-4 w-4" />;
            case "help_system": return <HelpCircle className="h-4 w-4" />;
            default: return <ExternalLink className="h-4 w-4" />;
        }
    };

    const getSourceLabel = (source: KBArticle["source"]) => {
        switch (source) {
            case "documentation": return "Documentation";
            case "previous_ticket": return "Previous Ticket";
            case "forum": return "Community Forum";
            case "help_system": return "Help System";
            default: return "External";
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                    <Book className="h-4 w-4 text-indigo-600" />
                    Knowledge Base
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium px-2 py-1 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700">
                    {matches.length} Suggestions
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {matches.map((article) => (
                    <div key={article.id} className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-all hover:border-indigo-200">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                <span className={cn(
                                    "flex items-center gap-1.5 px-2 py-1 rounded-md border",
                                    article.source === 'documentation' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                        article.source === 'previous_ticket' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                            "bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-800"
                                )}>
                                    {getIcon(article.source)}
                                    {getSourceLabel(article.source)}
                                </span>
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-bold",
                                    article.relevance >= 90 ? "bg-green-100 text-green-700" :
                                        article.relevance >= 70 ? "bg-yellow-100 text-yellow-700" :
                                            "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                )}>
                                    {article.relevance}% Match
                                </span>
                            </div>
                        </div>

                        <h4 className="font-semibold text-slate-900 dark:text-slate-50 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                            <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {article.title}
                            </a>
                        </h4>

                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3 leading-relaxed">
                            {article.excerpt}
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={() => onCite(article)}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 dark:border-slate-700 transition-all"
                            >
                                <Quote className="h-3.5 w-3.5" />
                                Cite in Reply
                            </button>
                            <a
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        </div>
                    </div>
                ))}

                {matches.length === 0 && (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <HelpCircle className="h-8 w-8 mx-auto mb-3 text-slate-300" />
                        <p className="text-sm">No relevant articles found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
