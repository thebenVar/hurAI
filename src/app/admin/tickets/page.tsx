"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Inbox, Building2, Loader2, ChevronRight } from "lucide-react";
import { getAllTickets, assignTicketToDepartment } from "@/app/actions/tickets";

interface Department {
    id: string;
    name: string;
}

interface Ticket {
    id: string;
    contact: string;
    topic: string;
    priority: string;
    status: string;
    category: string;
    createdAt: string;
}

export default function UnassignedTicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [assigningId, setAssigningId] = useState<string | null>(null);
    const [selectedDept, setSelectedDept] = useState<Record<string, string>>({});

    const fetchData = async () => {
        setIsLoading(true);
        const [ticketData, deptRes] = await Promise.all([
            getAllTickets({ unassignedOnly: true }),
            fetch("/api/departments").then(r => r.json())
        ]);
        setTickets(ticketData as Ticket[]);
        setDepartments(deptRes.departments || []);
        setIsLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleAssign = async (ticketId: string) => {
        const deptId = selectedDept[ticketId];
        if (!deptId) return;
        setAssigningId(ticketId);
        const result = await assignTicketToDepartment(ticketId, deptId);
        if (result.success) {
            setTickets(prev => prev.filter(t => t.id !== ticketId));
        }
        setAssigningId(null);
    };

    const getPriorityClass = (p: string) =>
        p === "high" ? "bg-red-50 text-red-700 border-red-100" :
            p === "medium" ? "bg-amber-50 text-amber-700 border-amber-100" :
                "bg-blue-50 text-blue-700 border-blue-100";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Inbox className="w-6 h-6 text-indigo-500" />
                    Unassigned Tickets
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Tickets not yet assigned to a department. Assign them to the appropriate team.
                </p>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : tickets.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
                    <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No unassigned tickets. You&apos;re all caught up!</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {tickets.map(ticket => (
                            <li key={ticket.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <Link href={`/tickets/${ticket.id}`} className="hover:text-indigo-600 transition-colors">
                                        <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">{ticket.topic}</p>
                                    </Link>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                        <span>{ticket.contact}</span>
                                        <span>•</span>
                                        <span className={`px-2 py-0.5 rounded border text-xs font-medium ${getPriorityClass(ticket.priority)}`}>
                                            {ticket.priority}
                                        </span>
                                        <span className="font-mono text-slate-400">{ticket.id.slice(0, 8)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <Building2 className="w-4 h-4 text-slate-400" />
                                    <select
                                        value={selectedDept[ticket.id] || ""}
                                        onChange={e => setSelectedDept(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                                        className="text-sm px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                        <option value="">Select department...</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => handleAssign(ticket.id)}
                                        disabled={!selectedDept[ticket.id] || assigningId === ticket.id}
                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                                    >
                                        {assigningId === ticket.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <>Assign <ChevronRight className="w-3.5 h-3.5" /></>
                                        )}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500">
                        {tickets.length} unassigned ticket{tickets.length !== 1 ? "s" : ""}
                    </div>
                </div>
            )}
        </div>
    );
}
