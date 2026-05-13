"use client";
import { useSession } from "next-auth/react";
import { ExternalLink, CheckSquare } from "lucide-react";
import Topbar from "@/components/layout/Topbar";
import { getInitials } from "@/lib/utils";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col h-screen">
      <Topbar title="Settings" />
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl space-y-6">

        {/* Profile card */}
        <Section title="Your Profile">
          <div className="flex items-center gap-4">
            {session?.user.image ? (
              <img src={session.user.image} alt={session.user.name}
                className="w-14 h-14 rounded-xl border border-white/10" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-brand-400/20 text-brand-300 font-bold text-lg flex items-center justify-center border border-white/10">
                {getInitials(session?.user.name ?? "U")}
              </div>
            )}
            <div>
              <div className="font-semibold text-white">{session?.user.name}</div>
              <div className="text-sm text-slate-400">{session?.user.email}</div>
              <div className="text-xs text-slate-600 font-mono mt-0.5">{session?.user.accountId}</div>
            </div>
          </div>
        </Section>

        {/* Jira connection */}
        <Section title="Jira Connection">
          <div className="space-y-3">
            <Row label="Workspace" value={session?.siteName ?? "—"} />
            <Row label="Site URL"  value={session?.siteUrl ?? "—"}   link={session?.siteUrl} />
            <Row label="Project Key" value={process.env.NEXT_PUBLIC_JIRA_PROJECT_KEY ?? "IOTA"} mono />
            <Row label="Auth"      value="Atlassian OAuth 2.0" />
            <div className="mt-3 flex items-center gap-2 text-xs text-green-400">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Connected and syncing
            </div>
          </div>
        </Section>

        {/* Webhook setup */}
        <Section title="Jira Webhook (Real-time Sync)">
          <p className="text-sm text-slate-400 mb-3">
            To receive real-time updates, register this endpoint in your Jira project settings:
          </p>
          <div className="bg-black/30 rounded-xl p-3 font-mono text-xs text-teal-200 border border-white/6 flex items-center justify-between gap-3">
            <span>{(session?.siteUrl ? `https://your-domain.com` : "https://your-domain.com")}/api/webhooks/jira</span>
            <button
              onClick={() => navigator.clipboard.writeText("https://your-domain.com/api/webhooks/jira")}
              className="text-slate-500 hover:text-slate-300 transition-colors text-[10px] border border-white/10 rounded-lg px-2 py-1"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            In Jira: Project Settings → Webhooks → Create. Enable: Issue Created, Updated, Deleted.
            In dev, expose via <span className="font-mono text-teal-300">npx ngrok http 3000</span>.
          </p>
        </Section>

        {/* Resources */}
        <Section title="Resources">
          <div className="space-y-2">
            {[
              { label: "Atlassian Developer Console", href: "https://developer.atlassian.com/console/myapps/" },
              { label: "Jira REST API Docs", href: "https://developer.atlassian.com/cloud/jira/platform/rest/v3/" },
              { label: "OAuth 2.0 Guide", href: "https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/" },
            ].map(({ label, href }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
                {label}
              </a>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-navy-50/80 border border-white/8 rounded-2xl p-5">
      <h2 className="text-sm font-semibold text-white mb-4 pb-3 border-b border-white/6">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value, link, mono }: { label: string; value: string; link?: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-slate-500">{label}</span>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer"
          className={`text-xs text-brand-400 hover:underline ${mono ? "font-mono" : ""}`}>
          {value}
        </a>
      ) : (
        <span className={`text-xs text-slate-300 ${mono ? "font-mono" : ""}`}>{value}</span>
      )}
    </div>
  );
}
