"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Ticket as TicketIcon, Mic, FileText, User } from "lucide-react";
import { getAllTickets } from "@/app/actions/tickets";
import { useSession } from "next-auth/react";

export function GuestDashboard() {
    const [tickets, setTickets] = useState<any[]>([]);
    const { data: session } = useSession();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const ticketsData = await getAllTickets();
                setTickets(ticketsData);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="flex flex-col gap-8 pb-8 max-w-5xl mx-auto w-full">
            <div className="text-center mb-6 mt-4">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-4">How can we help you today?</h1>
                <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">Create a new support request below. You can provide detailed text or seamlessly upload a media note (audio, image).</p>
            </div>

            {/* Quick Create Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
                <Link href="/tickets/create?view=manual-entry" className="group p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 hover:shadow-lg hover:-translate-y-1 transition-all text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                        <FileText className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">Regular Ticket</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Describe your issue in detail and attach documents.</p>
                </Link>
                <Link href="/tickets/create?view=upload" className="group p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-500 hover:shadow-lg hover:-translate-y-1 transition-all text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                        <Mic className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">Media Note</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Send us a picture, video, or voice note.</p>
                </Link>
            </div>

            {/* My Tickets */}
            <div className="mt-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-slate-400" />
                    My Previous Tickets
                </h2>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {tickets.length === 0 ? (
                            <div className="p-10 text-center text-slate-500 dark:text-slate-400 text-sm flex flex-col items-center">
                                <TicketIcon className="w-8 h-8 text-slate-300 mb-3" />
                                You haven't submitted any tickets yet.
                            </div>
                        ) : (
                            tickets.map((ticket) => (
                                <Link href={`/tickets/${ticket.id}`} key={ticket.id} className="block px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-base font-bold text-slate-900 dark:text-slate-50 group-hover:text-indigo-600 transition-colors truncate pr-4">
                                            {ticket.topic || ticket.summary}
                                        </span>
                                        <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full border font-medium ${ticket.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' :
                                            ticket.status === 'in-progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 truncate mb-3">
                                        {ticket.summary}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span className="font-mono">
                                            {ticket.ticketNumber ? `#TKT-${ticket.ticketNumber.toString().padStart(3, '0')}` : `#${ticket.id.slice(0, 8)}`}
                                        </span>
                                    </div>
                                </Link>
                            )))}
                    </div>
                </div>
            </div>
        </div>
    );
}
