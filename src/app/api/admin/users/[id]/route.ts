import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: targetUserId } = await params;
    const isSuperAdmin = session.user.role === "super_admin";
    const orgId = session.user.organizationId;

    try {
        // Fetch the user to ensure they exist and belong to the same org
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            include: {
                departments: {
                    include: { department: true }
                }
            }
        });

        if (!targetUser || targetUser.organizationId !== orgId) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // If not super admin, check if the current admin has rights over this user
        if (!isSuperAdmin) {
            // Find departments where current user is an admin
            const adminDepts = await prisma.userDepartment.findMany({
                where: { userId: session.user.id, role: "admin" },
                select: { departmentId: true }
            });
            const adminDeptIds = adminDepts.map(d => d.departmentId);

            // Check if the target user is in ANY of those departments
            const targetUserDeptIds = targetUser.departments.map(d => d.departmentId);
            const hasOverlap = targetUserDeptIds.some(id => adminDeptIds.includes(id));

            if (!hasOverlap) {
                return NextResponse.json({ error: "Forbidden: You do not manage any departments containing this user" }, { status: 403 });
            }
        }

        // Also fetch all available departments for this org so the UI can populate the "Add to Department" dropdown
        let availableDepartments = [];
        if (isSuperAdmin) {
            availableDepartments = await prisma.department.findMany({
                where: { organizationId: orgId },
                orderBy: { name: 'asc' }
            });
        } else {
            // Dept admins can only add users to departments they manage
            const adminDepts = await prisma.userDepartment.findMany({
                where: { userId: session.user.id, role: "admin" },
                include: { department: true }
            });
            availableDepartments = adminDepts.map(d => d.department);
        }

        return NextResponse.json({
            user: targetUser,
            availableDepartments
        });
    } catch (error) {
        console.error("Failed to fetch user:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
