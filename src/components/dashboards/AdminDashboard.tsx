"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MessageFeed, IncomingMessage } from "@/components/MessageFeed";
import { QuickActions } from "@/components/QuickActions";
import { getAllTickets, getDashboardStats } from "@/app/actions/tickets";

const MOCK_MESSAGES: IncomingMessage[] = [
    {
        id: "msg-1",
        sender: "John Doe",
        text: "Hey, the printer on the 2nd floor is jammed again. Can someone check it?",
        platform: "whatsapp",
        timestamp: "2m ago",
        avatarColor: "bg-green-100 text-green-700",
        type: "text"
    },
    {
        id: "msg-2",
        sender: "Priya Singh",
        text: "I'm locked out of my account. Error code 503.",
        platform: "whatsapp",
        timestamp: "15m ago",
        avatarColor: "bg-blue-100 text-blue-700",
        type: "text"
    },
    {
        id: "msg-3",
        sender: "marketing-team@company.com",
        text: "Urgent: Website is down for external traffic.",
        platform: "email",
        timestamp: "1h ago",
        avatarColor: "bg-purple-100 text-purple-700",
        type: "text"
    }
];

export function AdminDashboard() {
    const [messages, setMessages] = useState<IncomingMessage[]>(MOCK_MESSAGES);
    const [tickets, setTickets] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalTickets: 0,
        avgResolution: "--",
        customerSatisfaction: "--",
        pendingActions: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ticketsData, statsData] = await Promise.all([
                    getAllTickets(),
                    getDashboardStats()
                ]);
                setTickets(ticketsData);
                setStats(statsData);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            }
        };
        fetchData();
    }, []);

    const handleAddMessage = (text: string, type: "text" | "voice" | "image" | "video") => {
        const newMessage: IncomingMessage = {
            id: `msg-${Date.now()}`,
            sender: "You",
            text: type === "text" ? text : `Sent a ${type} note`,
            platform: "internal",
            timestamp: "Just now",
            avatarColor: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
            type: type
        };
        setMessages([newMessage, ...messages]);
    };

    const handleDismiss = (id: string) => {
        setMessages(messages.filter(m => m.id !== id));
    };

    return (
        <div className="flex flex-col gap-8 pb-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Tickets</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{stats.totalTickets}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Avg. Resolution</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{stats.avgResolution}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Customer Satisfaction</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{stats.customerSatisfaction}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Pending Actions</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{stats.pendingActions}</div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:h-[800px]">
                {/* Left Column: Live Inbox & Recent Activity */}
                <div className="lg:col-span-2 lg:h-full flex flex-col gap-6">
                    <div className="h-[350px] min-h-0 shrink-0">
                        <MessageFeed messages={messages} onDismiss={handleDismiss} />
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-50">Recent Activity</h3>
                            <Link href="/tickets" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                                View All <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
                            {tickets.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                                    No recent tickets found.
                                </div>
                            ) : (
                                tickets.map((ticket) => (
                                    <Link href={`/tickets/${ticket.id}`} key={ticket.id} className="block px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-colors cursor-pointer group">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                {ticket.ticketNumber ? `#TKT-${ticket.ticketNumber.toString().padStart(3, '0')}` : ticket.id.substring(0, 8)}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${ticket.priority === 'high' ? 'bg-red-50 text-red-700 border-red-100' :
                                                ticket.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                    'bg-blue-50 text-blue-700 border-blue-100'
                                                }`}>
                                                {ticket.priority}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50 group-hover:text-indigo-600 transition-colors truncate">
                                            {ticket.topic || ticket.summary}
                                        </h4>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                                            <span>{ticket.contact}</span>
                                            <span>•</span>
                                            <span>{ticket.timeSpent}</span>
                                        </div>
                                    </Link>
                                )))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Quick Actions & Insights */}
                <div className="lg:col-span-1 flex flex-col gap-6 lg:h-full lg:overflow-y-auto order-first lg:order-none">
                    <QuickActions onAddMessage={handleAddMessage} />

                    <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
                        <h3 className="font-semibold text-lg mb-2">Kingdom Cloud Services AI</h3>
                        <p className="text-indigo-200 text-sm mb-6">
                            3 emerging trends identified today.
                        </p>
                        <button className="w-full bg-white dark:bg-slate-900/10 hover:bg-white dark:bg-slate-900/20 text-white border border-white/20 rounded-lg py-2 text-sm font-medium transition-colors">
                            View Insights
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
