import { auth } from "@/lib/auth";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { UserDashboard } from "@/components/dashboards/UserDashboard";
import { GuestDashboard } from "@/components/dashboards/GuestDashboard";

export default async function DashboardPage() {
  const session = await auth();
  const role = session?.user?.role || "guest";

  if (role === "super_admin" || role === "admin") {
    return <AdminDashboard />;
  }

  if (role === "user") {
    return <UserDashboard />;
  }

  return <GuestDashboard />;
}
