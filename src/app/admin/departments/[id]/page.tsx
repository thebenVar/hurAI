"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { updateDepartment, deleteDepartment } from "@/app/actions/admin";
import Link from "next/link";
import { Building2, Save, ArrowLeft, Loader2, Trash2, Users } from "lucide-react";

export default function EditDepartmentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [department, setDepartment] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // Fetch department details client-side to easily manage state, 
        // or we could have done a server component. Since we have a delete modal/state, 
        // a client component approach is fine, but we need an API route for fetching. 
        // Let's use a server action to fetch instead!
        const fetchDept = async () => {
            try {
                const res = await fetch(`/api/admin/departments/${id}`);
                const data = await res.json();
                if (data.department) {
                    setDepartment(data.department);
                } else {
                    setError("Department not found");
                }
            } catch (err) {
                setError("Failed to load department");
            } finally {
                setIsLoading(false);
            }
        };
        fetchDept();
    }, [id]);

    async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSaving(true);
        setError("");

        const formData = new FormData(event.currentTarget);

        try {
            const result = await updateDepartment(id, formData);
            if (result.success) {
                router.push("/admin/departments");
                router.refresh();
            } else {
                setError(result.error || "Failed to update department");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this department? This action cannot be undone.")) {
            return;
        }

        setIsDeleting(true);
        setError("");

        try {
            const result = await deleteDepartment(id);
            if (result.success) {
                router.push("/admin/departments");
                router.refresh();
            } else {
                setError(result.error || "Failed to delete department");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setIsDeleting(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!department && !isLoading) {
        return (
            <div className="text-center p-12">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Department Not Found</h2>
                <Link href="/admin/departments" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    &larr; Back to Departments
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/admin/departments"
                    className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Building2 className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Department</h1>
                    <p className="text-sm text-slate-500 mt-1">Update department details or remove it.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <form onSubmit={handleUpdate} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6 space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg border border-red-200 dark:border-red-800/30">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Department Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    defaultValue={department.name}
                                    required
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white dark:bg-slate-900"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="description" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    defaultValue={department.description || ""}
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white dark:bg-slate-900 resize-none"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Delete Department
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>

                <div className="md:col-span-1">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-500" />
                                Assigned Users
                            </h3>
                        </div>
                        <div className="p-5">
                            {department.users?.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-4">No users assigned yet.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {department.users?.map((ud: any) => (
                                        <li key={ud.userId} className="flex items-center justify-between text-sm">
                                            <span className="font-medium text-slate-900 dark:text-slate-100">{ud.user?.name || ud.user?.email}</span>
                                            <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 capitalize">
                                                {ud.role}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <Link
                                    href={`/admin/users?department=${department.id}`}
                                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium block text-center"
                                >
                                    Manage Users &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
