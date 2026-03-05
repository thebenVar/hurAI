import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Building2, Users, Activity } from "lucide-react";

export default async function AdminDashboardPage() {
    const session = await auth();

    // Depending on whether it's a super_admin or admin, metrics might differ.
    // For now, let's fetch global metrics if super_admin.
    const isSuperAdmin = session?.user?.role === "super_admin";

    let totalUsers = 0;
    let totalDepartments = 0;
    let activeTickets = 0;

    if (isSuperAdmin) {
        totalUsers = await prisma.user.count();
        totalDepartments = await prisma.department.count();
        activeTickets = await prisma.ticket.count({
            where: { status: { not: "resolved" } }
        });
    } else {
        // Department Admin logic: count users in their departments
        const adminDepts = await prisma.userDepartment.findMany({
            where: { userId: session?.user?.id, role: "admin" },
            select: { departmentId: true }
        });

        const deptIds = adminDepts.map(d => d.departmentId);

        totalDepartments = deptIds.length;

        // Count unique users across these departments
        totalUsers = await prisma.user.count({
            where: {
                departments: {
                    some: {
                        departmentId: { in: deptIds }
                    }
                }
            }
        });

        // Optional: Count tickets assigned to users in these departments (assuming we had a user link, for now just 0 as placeholder)
        activeTickets = 0; // Future phase: relate tickets to departments or users
    }

    const stats = [
        { name: "Total Users", value: totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
        { name: "Departments", value: totalDepartments, icon: Building2, color: "text-indigo-600", bg: "bg-indigo-100 dark:bg-indigo-900/30" },
        { name: "Active Tickets", value: activeTickets, icon: Activity, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Welcome back, {session?.user?.name}. Manage your organization&apos;s settings here.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => (
                    <div key={stat.name} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.name}</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm mt-8">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Activity</h2>
                <div className="text-sm text-slate-500 text-center py-8">
                    Activity feed will be implemented in future phases.
                </div>
            </div>
        </div>
    );
}
