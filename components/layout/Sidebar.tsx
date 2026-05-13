"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LayoutGrid, BarChart2, Settings, LogOut, CheckSquare } from "lucide-react";
import { getInitials } from "@/lib/utils";

const NAV = [
  { href: "/board",    label: "Board",    icon: LayoutGrid },
  { href: "/stats",    label: "Stats",    icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, bottom: 0, width: 220,
      display: "flex", flexDirection: "column",
      background: "#162435",
      borderRight: "1px solid rgba(255,255,255,0.07)",
      zIndex: 30,
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "linear-gradient(135deg, #1E6FD9, #00C2CB)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <CheckSquare size={16} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1 }}>IOTA To-Do</div>
            <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>
              {session?.siteName ?? "Jira Connected"}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 10, textDecoration: "none",
              fontSize: 13, fontWeight: 500,
              background: active ? "rgba(30,111,217,0.15)" : "transparent",
              color: active ? "#4D96D9" : "#64748b",
              transition: "all 0.15s",
            }}>
              <Icon size={15} color={active ? "#1E6FD9" : "#475569"} />
              {label}
              {active && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#1E6FD9" }} />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10 }}>
          {session?.user?.image ? (
            <img src={session.user.image} alt="" style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(30,111,217,0.2)", color: "#4D96D9", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {getInitials(session?.user?.name ?? "U")}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{session?.user?.name ?? "User"}</div>
            <div style={{ fontSize: 10, color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{session?.user?.email}</div>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} title="Sign out"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", padding: 4, borderRadius: 6, display: "flex" }}>
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}