import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Building2, ChevronRight, Users } from "lucide-react";

export default async function DepartmentsPage() {
    const session = await auth();

    // In a future step, department admins will only see their assigned departments.
    // For now, super admins see all departments.
    const isSuperAdmin = session?.user?.role === "super_admin";

    let departments = [];

    if (isSuperAdmin) {
        departments = await prisma.department.findMany({
            include: {
                _count: {
                    select: { users: true }
                }
            },
            orderBy: { name: 'asc' }
        });
    } else {
        // Find departments where the user is an admin
        const userDepts = await prisma.userDepartment.findMany({
            where: { userId: session?.user?.id, role: "admin" },
            include: {
                department: {
                    include: {
                        _count: {
                            select: { users: true }
                        }
                    }
                }
            }
        });
        departments = userDepts.map(ud => ud.department);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Departments</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage organizational departments and their assigned users.</p>
                </div>
                {isSuperAdmin && (
                    <Link
                        href="/admin/departments/new"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Create Department
                    </Link>
                )}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                {departments.length === 0 ? (
                    <div className="p-8 text-center">
                        <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No departments found</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            {isSuperAdmin ? "Get started by creating your first department." : "You are not an admin of any departments."}
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                        {departments.map((dept) => (
                            <li key={dept.id}>
                                <Link
                                    href={`/admin/departments/${dept.id}`}
                                    className="block hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <div className="px-6 py-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{dept.name}</p>
                                                {dept.description ? (
                                                    <p className="text-xs text-slate-500 truncate max-w-md mt-0.5">{dept.description}</p>
                                                ) : (
                                                    <p className="text-xs text-slate-400 italic mt-0.5">No description provided</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center text-xs text-slate-500 gap-1.5">
                                                <Users className="w-4 h-4" />
                                                <span>{dept._count.users} members</span>
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
