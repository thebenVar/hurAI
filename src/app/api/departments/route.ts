import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Returns the list of departments available to the current user for ticket assignment.
 * - super_admin: all departments in the org
 * - admin/user: only their own department memberships
 */
export async function GET() {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    const userId = session.user.id;
    const orgId = session.user.organizationId;

    try {
        if (role === "super_admin") {
            const departments = await prisma.department.findMany({
                where: { organizationId: orgId },
                select: { id: true, name: true },
                orderBy: { name: "asc" }
            });
            return NextResponse.json({ departments });
        } else {
            const userDepts = await prisma.userDepartment.findMany({
                where: { userId },
                include: { department: { select: { id: true, name: true } } }
            });
            const departments = userDepts.map(ud => ud.department);
            return NextResponse.json({ departments });
        }
    } catch (error) {
        console.error("Failed to fetch departments:", error);
        return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
    }
}
