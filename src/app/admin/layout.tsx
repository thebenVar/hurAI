import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const role = session.user.role;
    if (role !== "super_admin" && role !== "admin") {
        redirect("/");
    }

    // The root AppLayout already provides the sidebar + header shell.
    // This layout only enforces the role-based access check.
    return <>{children}</>;
}
