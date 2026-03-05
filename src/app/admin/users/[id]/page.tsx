"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole, assignUserToDepartment, removeUserFromDepartment } from "@/app/actions/admin";
import Link from "next/link";
import { ArrowLeft, Loader2, Shield, Trash2, Info, Building2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface UserProfile {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: string;
    departments: Array<{
        departmentId: string;
        role: string;
        department: {
            id: string;
            name: string;
        };
    }>;
}

interface DepartmentItem {
    id: string;
    name: string;
}

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: session } = useSession();

    const [user, setUser] = useState<UserProfile | null>(null);
    const [availableDepartments, setAvailableDepartments] = useState<DepartmentItem[]>([]);

    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingRole, setIsSavingRole] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [removingDeptId, setRemovingDeptId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Form State
    const [selectedRole, setSelectedRole] = useState("");
    const [newDeptId, setNewDeptId] = useState("");
    const [newLocalRole, setNewLocalRole] = useState("member");

    const isSuperAdmin = session?.user?.role === "super_admin";

    const fetchUser = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/users/${id}`);
            const data = await res.json();
            if (data.user) {
                setUser(data.user);
                setSelectedRole(data.user.role);
                setAvailableDepartments(data.availableDepartments || []);
            } else {
                setError(data.error || "User not found");
            }
        } catch (err) {
            setError("Failed to load user");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const handleRoleUpdate = async () => {
        setIsSavingRole(true);
        setError("");
        setSuccessMessage("");
        try {
            const result = await updateUserRole(id, selectedRole);
            if (result.success) {
                setSuccessMessage("Global role updated successfully.");
                setTimeout(() => setSuccessMessage(""), 3000);
            } else {
                setError(result.error || "Failed to update role");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setIsSavingRole(false);
        }
    };

    const handleAssignDepartment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDeptId) return;

        setIsAssigning(true);
        setError("");
        setSuccessMessage("");
        try {
            const result = await assignUserToDepartment(id, newDeptId, newLocalRole);
            if (result.success) {
                setSuccessMessage("Department assigned successfully.");
                setNewDeptId("");
                setNewLocalRole("member");
                await fetchUser(); // Reload data
                setTimeout(() => setSuccessMessage(""), 3000);
            } else {
                setError(result.error || "Failed to assign department");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setIsAssigning(false);
        }
    };

    const handleRemoveDepartment = async (deptId: string) => {
        if (!confirm("Are you sure you want to remove this user from this department?")) return;

        setRemovingDeptId(deptId);
        setError("");
        setSuccessMessage("");
        try {
            const result = await removeUserFromDepartment(id, deptId);
            if (result.success) {
                setSuccessMessage("Removed from department.");
                await fetchUser(); // Reload data
                setTimeout(() => setSuccessMessage(""), 3000);
            } else {
                setError(result.error || "Failed to remove department");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setRemovingDeptId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!user && !isLoading) {
        return (
            <div className="text-center p-12">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">User Not Accessible</h2>
                <div className="max-w-md mx-auto mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm font-medium rounded-lg text-left">
                    <p>{error || "You do not have permission to manage this user or they do not exist."}</p>
                </div>
                <Link href="/admin/users" className="text-indigo-600 hover:text-indigo-700 font-medium inline-block mt-6">
                    &larr; Back to Users
                </Link>
            </div>
        );
    }

    if (!user) return null; // Satisfy TypeScript null check

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/admin/users"
                    className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 font-bold border border-slate-200 dark:border-slate-700">
                    {user.image ? (
                        <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
                    ) : (
                        (user.name?.[0] || user.email?.[0] || "?").toUpperCase()
                    )}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{user.name || "Unnamed User"}</h1>
                    <p className="text-sm text-slate-500 mt-1">{user.email}</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg border border-red-200 dark:border-red-800/30">
                    {error}
                </div>
            )}
            {successMessage && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-medium rounded-lg border border-green-200 dark:border-green-800/30">
                    {successMessage}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Global Role Panel */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-indigo-500" />
                        <h3 className="font-semibold text-slate-900 dark:text-white">Global Role</h3>
                    </div>

                    <div className="p-5 flex-1 space-y-4">
                        {!isSuperAdmin && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg flex items-start gap-3">
                                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                    Only Super Admins can securely change a user&apos;s global role. As a Department Admin, you can only govern their department assignments.
                                </p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Current Role: <span className="uppercase text-xs tracking-wider px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md ml-2">{user.role.replace('_', ' ')}</span>
                            </label>

                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                disabled={!isSuperAdmin || isSavingRole}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white dark:bg-slate-900 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800"
                            >
                                <option value="guest">Guest</option>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
                        </div>
                    </div>

                    {isSuperAdmin && (
                        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                            <button
                                onClick={handleRoleUpdate}
                                disabled={isSavingRole || selectedRole === user.role}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSavingRole && <Loader2 className="w-4 h-4 animate-spin" />}
                                Update Role
                            </button>
                        </div>
                    )}
                </div>

                {/* Departments Panel */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-500" />
                        <h3 className="font-semibold text-slate-900 dark:text-white">Department Assignments</h3>
                    </div>

                    <div className="p-0 flex-1">
                        {user.departments?.length === 0 ? (
                            <div className="p-8 text-center text-sm text-slate-500">
                                Not assigned to any departments.
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                {user.departments?.map((ud) => (
                                    <li key={ud.departmentId} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div>
                                            <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                                                {ud.department?.name}
                                            </p>
                                            <p className="text-xs text-slate-500 capitalize mt-0.5">Role: {ud.role}</p>
                                        </div>
                                        {/* Only allow removal if super_admin OR if the current admin actually manages THIS specific department.
                                            We fetched availableDepartments which contains all departments the current user manages. */}
                                        {(isSuperAdmin || availableDepartments.some(d => d.id === ud.departmentId)) && (
                                            <button
                                                onClick={() => handleRemoveDepartment(ud.departmentId)}
                                                disabled={removingDeptId === ud.departmentId}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                {removingDeptId === ud.departmentId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
                        <form onSubmit={handleAssignDepartment} className="flex gap-2 items-end">
                            <div className="flex-1 space-y-1">
                                <label className="text-xs font-medium text-slate-500">Add to Department</label>
                                <select
                                    required
                                    value={newDeptId}
                                    onChange={(e) => setNewDeptId(e.target.value)}
                                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-sm"
                                >
                                    <option value="" disabled>Select Department...</option>
                                    {availableDepartments
                                        .filter(d => !user.departments?.some((ud) => ud.departmentId === d.id)) // Exclude currently assigned
                                        .map((d) => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div className="w-32 space-y-1">
                                <label className="text-xs font-medium text-slate-500">Local Role</label>
                                <select
                                    value={newLocalRole}
                                    onChange={(e) => setNewLocalRole(e.target.value)}
                                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-900 text-sm"
                                >
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={isAssigning || !newDeptId}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isAssigning ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Add"}
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}
