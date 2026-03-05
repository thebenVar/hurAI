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

    const { id: departmentId } = await params;
    const isSuperAdmin = session.user.role === "super_admin";

    // Check if the user has access to this department
    if (!isSuperAdmin) {
        const userDept = await prisma.userDepartment.findUnique({
            where: {
                userId_departmentId: {
                    userId: session.user.id,
                    departmentId: departmentId,
                }
            }
        });

        if (!userDept || userDept.role !== "admin") {
            return NextResponse.json({ error: "Forbidden: Not an admin of this department" }, { status: 403 });
        }
    }

    try {
        const department = await prisma.department.findUnique({
            where: { id: departmentId },
            include: {
                users: {
                    include: {
                        user: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                }
            }
        });

        if (!department) {
            return NextResponse.json({ error: "Department not found" }, { status: 404 });
        }

        return NextResponse.json({ department });
    } catch (error) {
        console.error("Failed to fetch department:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
