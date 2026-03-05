"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function setupOrganization(name: string) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return { success: false, error: "Not authenticated" };
        }

        // Double check if an org already exists to prevent multiple orgs
        const existingOrg = await prisma.organization.findFirst();
        if (existingOrg) {
            return { success: false, error: "Organization already exists" };
        }

        // Use a transaction to ensure org and user are created/updated together
        await prisma.$transaction(async (tx) => {
            const org = await tx.organization.create({
                data: { name },
            });

            // Update or create the super admin user
            const existingUser = await tx.user.findUnique({
                where: { email: session.user.email as string },
            });

            if (existingUser) {
                await tx.user.update({
                    where: { id: existingUser.id },
                    data: {
                        role: "super_admin",
                        organizationId: org.id,
                    },
                });
            } else {
                await tx.user.create({
                    data: {
                        email: session.user.email as string,
                        name: (session.user.name as string) || "Super Admin",
                        role: "super_admin",
                        organizationId: org.id,
                    },
                });
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Setup Organization failed:", error);
        return { success: false, error: "Failed to setup organization" };
    }
}
