import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { User, ChevronRight, Shield, Building2 } from "lucide-react";

export default async function UsersPage() {
    const session = await auth();

    const isSuperAdmin = session?.user?.role === "super_admin";
    const userId = session?.user?.id;
    const orgId = session?.user?.organizationId;

    let users = [];

    if (isSuperAdmin) {
        // Super admin sees all users in the organization
        users = await prisma.user.findMany({
            where: { organizationId: orgId },
            include: {
                departments: {
                    include: { department: true }
                }
            },
            orderBy: { name: 'asc' }
        });
    } else {
        // Find departments where the user is an admin
        const adminDepts = await prisma.userDepartment.findMany({
            where: { userId: userId, role: "admin" },
            select: { departmentId: true }
        });

        const adminDeptIds = adminDepts.map(d => d.departmentId);

        // Fetch all users that belong to those departments
        users = await prisma.user.findMany({
            where: {
                organizationId: orgId,
                departments: {
                    some: {
                        departmentId: { in: adminDeptIds }
                    }
                }
            },
            include: {
                departments: {
                    include: { department: true }
                }
            },
            orderBy: { name: 'asc' }
        });
    }

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'super_admin': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
            case 'admin': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
            case 'user': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Organization Users</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {isSuperAdmin
                            ? "Manage all users and their global roles."
                            : "Manage users within your assigned departments."}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                {users.length === 0 ? (
                    <div className="p-8 text-center">
                        <User className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No users found</h3>
                        <p className="text-sm text-slate-500 mt-1">There are no accessible users to display.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                        {users.map((u) => (
                            <li key={u.id}>
                                <Link
                                    href={`/admin/users/${u.id}`}
                                    className="block hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <div className="px-6 py-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold overflow-hidden ring-2 ring-white dark:ring-slate-900 shadow-sm">
                                                {u.image ? (
                                                    <img src={u.image} alt={u.name || "User"} className="w-full h-full object-cover" />
                                                ) : (
                                                    (u.name?.[0] || u.email?.[0] || "?").toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                        {u.name || "Unnamed User"}
                                                    </p>
                                                    <span className={`px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-full border ${getRoleBadgeColor(u.role)}`}>
                                                        {u.role.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">{u.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="hidden md:flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-slate-400" />
                                                <span className="text-xs text-slate-500">
                                                    {u.departments.length} Dept(s)
                                                </span>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-400" />
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
