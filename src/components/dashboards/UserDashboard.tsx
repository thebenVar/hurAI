"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Ticket as TicketIcon, Mic, FileText, Send, Building2 } from "lucide-react";
import { getAllTickets } from "@/app/actions/tickets";
import { useSession } from "next-auth/react";

export function UserDashboard() {
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
        <div className="flex flex-col gap-8 pb-8 max-w-7xl mx-auto w-full">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Hello, {session?.user?.name || "User"} 👋</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Here is a summary of your department's active requests and quick actions.</p>
            </div>

            {/* Quick Create Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/tickets/create?view=manual-entry" className="group p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                        <FileText className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">Create Regular Ticket</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Standard request with a title, detailed description, and attachments.</p>
                </Link>
                <Link href="/tickets/create?view=upload" className="group p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-500 hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                        <Mic className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">Create Media Note</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Quickly upload a voice note, image, or video to report an issue without typing.</p>
                </Link>
            </div>

            {/* Recent Department Tickets */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-500" />
                        Your Department Tickets
                    </h3>
                    <Link href="/tickets" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                        View All <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {tickets.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm flex flex-col items-center">
                            <TicketIcon className="w-10 h-10 text-slate-300 mb-4" />
                            There are no active tickets for your department(s).
                        </div>
                    ) : (
                        tickets.map((ticket) => (
                            <Link href={`/tickets/${ticket.id}`} key={ticket.id} className="block px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-50 group-hover:text-indigo-600 transition-colors">
                                        {ticket.topic || ticket.summary}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${ticket.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-100' :
                                        ticket.status === 'in-progress' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                            'bg-blue-50 text-blue-700 border-blue-100'
                                        }`}>
                                        {ticket.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="font-mono">
                                        {ticket.ticketNumber ? `#TKT-${ticket.ticketNumber.toString().padStart(3, '0')}` : `#${ticket.id.slice(0, 8)}`}
                                    </span>
                                    <span>•</span>
                                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span className="text-indigo-500 font-medium">{ticket.departmentName || "Unassigned"}</span>
                                </div>
                            </Link>
                        )))}
                </div>
            </div>
        </div>
    );
}
