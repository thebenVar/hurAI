"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    PlusCircle,
    Ticket,
    Settings,
    Headset,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "New Ticket", href: "/tickets/create", icon: PlusCircle },
    { label: "All Tickets", href: "/tickets", icon: Ticket }, // Placeholder
    { label: "Settings", href: "/settings", icon: Settings }, // Placeholder
];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside className={cn(
            "fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 transition-transform duration-300 lg:translate-x-0",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            <div className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                        <Headset className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
                        Kingdom Cloud<span className="text-indigo-600"> Services</span>
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <nav className="space-y-1 p-4">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => onClose?.()}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-indigo-50 text-indigo-600"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100 dark:text-slate-50"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive ? "text-indigo-600" : "text-slate-400")} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

        </aside>
    );
}
