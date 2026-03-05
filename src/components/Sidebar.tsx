"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    LayoutDashboard,
    PlusCircle,
    Ticket,
    Settings,
    Headset,
    X,
    Building2,
    Users,
    ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MAIN_NAV = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard, exact: true },
    { label: "New Ticket", href: "/tickets/create", icon: PlusCircle, exact: true },
    { label: "All Tickets", href: "/tickets", icon: Ticket, exact: false },
    { label: "Settings", href: "/settings", icon: Settings, exact: false },
];

const ADMIN_NAV = [
    { label: "Overview", href: "/admin", icon: ShieldCheck, exact: true },
    { label: "Departments", href: "/admin/departments", icon: Building2, exact: false },
    { label: "Users", href: "/admin/users", icon: Users, exact: false },
];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();

    const role = session?.user?.role;
    const isAdmin = role === "super_admin" || role === "admin";

    const isActive = (href: string, exact: boolean) =>
        exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

    return (
        <aside className={cn(
            "fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 transition-transform duration-300 lg:translate-x-0 flex flex-col",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            {/* Logo */}
            <div className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                        <Headset className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
                        Kingdom Cloud<span className="text-indigo-600">Services</span>
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {/* Main section */}
                {MAIN_NAV.map((item) => {
                    const active = isActive(item.href, item.exact);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => onClose?.()}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                active
                                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
                            {item.label}
                        </Link>
                    );
                })}

                {/* Admin section */}
                {isAdmin && (
                    <>
                        <div className="pt-4 pb-2">
                            <p className="px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                Admin
                            </p>
                        </div>
                        {ADMIN_NAV.map((item) => {
                            const active = isActive(item.href, item.exact);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => onClose?.()}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                        active
                                            ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                                    )}
                                >
                                    <item.icon className={cn("h-5 w-5", active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </>
                )}
            </nav>
        </aside>
    );
}
