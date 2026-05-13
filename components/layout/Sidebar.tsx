"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LayoutGrid, BarChart2, Settings, LogOut, CheckSquare } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

const NAV = [
  { href: "/board",    label: "Board",     icon: LayoutGrid },
  { href: "/stats",    label: "Stats",     icon: BarChart2 },
  { href: "/settings", label: "Settings",  icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] flex flex-col bg-navy-100/90 border-r border-white/6 z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-400 flex items-center justify-center flex-shrink-0">
            <CheckSquare className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-none">IOTA To-Do</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {session?.siteName ?? "Jira Connected"}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                active
                  ? "bg-brand-400/15 text-brand-300 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              <Icon className={cn("w-4 h-4", active ? "text-brand-400" : "text-slate-500")} />
              {label}
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="px-3 py-4 border-t border-white/6">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors group">
          {session?.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name}
              className="w-8 h-8 rounded-full border border-white/10 flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand-400/20 flex items-center justify-center text-brand-300 text-xs font-semibold flex-shrink-0">
              {getInitials(session?.user.name ?? "U")}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-slate-200 truncate">
              {session?.user.name}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {session?.user.email}
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-400/10 text-slate-500 hover:text-red-400"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
