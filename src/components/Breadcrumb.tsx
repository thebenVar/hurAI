"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

// Human-readable labels for known path segments
const SEGMENT_LABELS: Record<string, string> = {
    admin: "Admin",
    departments: "Departments",
    users: "Users",
    tickets: "Tickets",
    settings: "Settings",
    create: "New Ticket",
    new: "New",
};

function getLabel(segment: string, index: number, segments: string[]): string {
    // If it's the segment after 'departments' or 'users', it's an ID - show "Edit"
    const prevSegment = segments[index - 1];
    if (prevSegment === "departments" || prevSegment === "users") {
        return "Edit";
    }
    return SEGMENT_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function Breadcrumb() {
    const pathname = usePathname();

    // Don't show breadcrumb on root
    if (!pathname || pathname === "/") return null;

    const segments = pathname.split("/").filter(Boolean);

    const crumbs = segments.map((segment, i) => {
        const href = "/" + segments.slice(0, i + 1).join("/");
        const label = getLabel(segment, i, segments);
        const isLast = i === segments.length - 1;
        return { href, label, isLast };
    });

    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 px-4 lg:px-8 py-3 text-sm text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50">
            <Link
                href="/"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
            >
                <Home className="w-3.5 h-3.5" />
            </Link>

            {crumbs.map((crumb) => (
                <span key={crumb.href} className="flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                    {crumb.isLast ? (
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                            {crumb.label}
                        </span>
                    ) : (
                        <Link
                            href={crumb.href}
                            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                            {crumb.label}
                        </Link>
                    )}
                </span>
            ))}
        </nav>
    );
}
