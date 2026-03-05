import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, Users, LayoutDashboard, Settings } from "lucide-react";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // Verify authentication and role
    if (!session?.user) {
        redirect("/login");
    }

    const role = session.user.role;
    if (role !== "super_admin" && role !== "admin") {
        redirect("/"); // Unauthorized users get sent back to the main app
    }

    // Determine navigation based on role. Super Admins see all, Department Admins might see less later.
    const navItems = [
        { name: "Overview", href: "/admin", icon: LayoutDashboard },
        { name: "Departments", href: "/admin/departments", icon: Building2 },
        { name: "Users", href: "/admin/users", icon: Users },
        { name: "Settings", href: "/settings", icon: Settings }, // Link back to global settings
    ];

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-900/50">
            {/* Admin Sidebar */}
            <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-shrink-0">
                <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Settings className="w-5 h-5 text-indigo-600" />
                        Admin Portal
                    </span>
                </div>
                <nav className="p-4 space-y-1 text-sm font-medium">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-3 py-2 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                            <item.icon className="w-5 h-5 opacity-75" />
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
