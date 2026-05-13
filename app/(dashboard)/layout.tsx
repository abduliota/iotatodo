import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0D1B2A" }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 220, display: "flex", flexDirection: "column", minHeight: "100vh", overflow: "hidden" }}>
        {children}
      </main>
    </div>
  );
}