"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createDepartment(formData: FormData) {
    const session = await auth();

    if (!session?.user || session.user.role !== "super_admin") {
        throw new Error("Unauthorized: Only super admins can create departments.");
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const organizationId = session.user.organizationId;

    if (!name || !organizationId) {
        throw new Error("Missing required fields");
    }

    try {
        await prisma.department.create({
            data: {
                name,
                description,
                organizationId,
            },
        });

        revalidatePath("/admin/departments");
        return { success: true };
    } catch (error) {
        console.error("Failed to create department:", error);
        return { success: false, error: "Failed to create department" };
    }
}

export async function updateDepartment(id: string, formData: FormData) {
    const session = await auth();

    if (!session?.user || session.user.role !== "super_admin") {
        throw new Error("Unauthorized: Only super admins can update departments.");
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name || !id) {
        throw new Error("Missing required fields");
    }

    try {
        await prisma.department.update({
            where: { id },
            data: {
                name,
                description,
            },
        });

        revalidatePath("/admin/departments");
        revalidatePath(`/admin/departments/${id}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update department:", error);
        return { success: false, error: "Failed to update department" };
    }
}

export async function deleteDepartment(id: string) {
    const session = await auth();

    if (!session?.user || session.user.role !== "super_admin") {
        throw new Error("Unauthorized: Only super admins can delete departments.");
    }

    if (!id) {
        throw new Error("Missing department ID");
    }

    try {
        await prisma.department.delete({
            where: { id },
        });

        revalidatePath("/admin/departments");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete department:", error);
        return { success: false, error: "Failed to delete department" };
    }
}

export async function updateUserRole(userId: string, newRole: string) {
    const session = await auth();

    // Only super_admins can change global roles
    if (!session?.user || session.user.role !== "super_admin") {
        throw new Error("Unauthorized: Only super admins can change global roles.");
    }

    if (!userId || !newRole) {
        throw new Error("Missing required fields");
    }

    const validRoles = ["super_admin", "admin", "user", "guest"];
    if (!validRoles.includes(newRole)) {
        throw new Error("Invalid role specified");
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { role: newRole },
        });

        revalidatePath("/admin/users");
        revalidatePath(`/admin/users/${userId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update user role:", error);
        return { success: false, error: "Failed to update user role" };
    }
}

async function isDepartmentAdmin(userId: string, departmentId: string) {
    const record = await prisma.userDepartment.findUnique({
        where: {
            userId_departmentId: { userId, departmentId }
        }
    });
    return record?.role === "admin";
}

export async function assignUserToDepartment(userId: string, departmentId: string, localRole: string) {
    const session = await auth();

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const isSuperAdmin = session.user.role === "super_admin";

    if (!isSuperAdmin) {
        const isAdmin = await isDepartmentAdmin(session.user.id, departmentId);
        if (!isAdmin) {
            throw new Error("Forbidden: You must be a department admin to make assignments.");
        }
    }

    if (!['member', 'admin'].includes(localRole)) {
        throw new Error("Invalid local role");
    }

    try {
        await prisma.userDepartment.upsert({
            where: {
                userId_departmentId: { userId, departmentId }
            },
            update: {
                role: localRole
            },
            create: {
                userId,
                departmentId,
                role: localRole
            }
        });

        revalidatePath("/admin/users");
        revalidatePath(`/admin/users/${userId}`);
        revalidatePath(`/admin/departments/${departmentId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to assign user:", error);
        return { success: false, error: "Failed to assign user to department" };
    }
}

export async function removeUserFromDepartment(userId: string, departmentId: string) {
    const session = await auth();

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const isSuperAdmin = session.user.role === "super_admin";

    if (!isSuperAdmin) {
        const isAdmin = await isDepartmentAdmin(session.user.id, departmentId);
        if (!isAdmin) {
            throw new Error("Forbidden: You must be a department admin to remove users.");
        }
    }

    try {
        await prisma.userDepartment.delete({
            where: {
                userId_departmentId: { userId, departmentId }
            }
        });

        revalidatePath("/admin/users");
        revalidatePath(`/admin/users/${userId}`);
        revalidatePath(`/admin/departments/${departmentId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to remove user:", error);
        return { success: false, error: "Failed to remove user from department" };
    }
}
