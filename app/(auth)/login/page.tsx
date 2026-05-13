"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) router.replace("/board");
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-brand-400/5 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-teal-200/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-400 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L18 7V13L10 18L2 13V7L10 2Z"
                  stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M10 6V10M10 10L13 12M10 10L7 12"
                  stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-xl font-semibold tracking-tight text-white">
              IOTA To-Do
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back
          </h1>
          <p className="text-slate-400 text-sm">
            Sign in with your Atlassian account to sync your Jira workspace
          </p>
        </div>

        {/* Card */}
        <div className="bg-navy-50/80 border border-white/8 rounded-2xl p-8 shadow-2xl">
          <button
            onClick={() => { setLoading(true); signIn("atlassian", { callbackUrl: "/board" }); }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl transition-all duration-150 group"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <AtlassianIcon />
            )}
            {loading ? "Connecting to Atlassian…" : "Continue with Atlassian"}
          </button>

          <div className="mt-6 pt-6 border-t border-white/8">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              IOTA To-Do connects to your Jira workspace via Atlassian OAuth 2.0.
              Your credentials are never stored — only a secure access token.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-8">
          IOTA Technologies · Powered by Jira Cloud
        </p>
      </div>
    </div>
  );
}

function AtlassianIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.3 14.5C11.1 14.3 10.8 14.3 10.6 14.5L5.7 20.5C5.5 20.7 5.6 21 5.9 21H13.4C13.6 21 13.8 20.9 13.9 20.7C15.1 18.4 14.6 16.1 11.3 14.5Z" fill="white"/>
      <path d="M15.9 4.2C13.1 8.8 13.4 13.7 16.2 17.4L20.1 21H26.1C26.4 21 26.5 20.7 26.3 20.5C26.3 20.5 17.9 7.1 17.2 6C16.8 5.3 16.3 4.2 15.9 4.2Z" fill="white"/>
    </svg>
  );
}
