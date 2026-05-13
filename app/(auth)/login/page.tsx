"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/board");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0D1B2A 0%, #0f2744 50%, #0D1B2A 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          width: 32, height: 32,
          border: "2px solid rgba(30,111,217,0.3)",
          borderTopColor: "#1E6FD9",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0D1B2A 0%, #0f2744 60%, #0D1B2A 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background glows */}
      <div style={{
        position: "absolute", top: "-10%", right: "-5%",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(30,111,217,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-15%", left: "-10%",
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,194,203,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "40%", left: "30%",
        width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(30,111,217,0.05) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Card */}
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: 420,
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56, height: 56,
            background: "linear-gradient(135deg, #1E6FD9, #00C2CB)",
            borderRadius: 16,
            marginBottom: 20,
            boxShadow: "0 8px 32px rgba(30,111,217,0.35)",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z"
                stroke="white" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(255,255,255,0.1)"/>
              <path d="M12 7V12M12 12L15 14M12 12L9 14"
                stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={{
            fontSize: 32, fontWeight: 700, color: "#ffffff",
            margin: "0 0 8px", letterSpacing: "-0.5px",
          }}>
            IOTA To-Do
          </h1>
          <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>
            Jira-powered task management
          </p>
        </div>

        {/* Main card */}
        <div style={{
          background: "rgba(22, 36, 53, 0.9)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: "32px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
        }}>
          <p style={{
            fontSize: 14, color: "#94a3b8", textAlign: "center",
            marginBottom: 24, lineHeight: 1.6,
          }}>
            Sign in with your Atlassian account to connect your Jira workspace
          </p>

          {/* Sign in button */}
          <button
            onClick={() => { setLoading(true); signIn("atlassian", { callbackUrl: "/board" }); }}
            disabled={loading}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "13px 24px",
              background: loading
                ? "rgba(30,111,217,0.5)"
                : "linear-gradient(135deg, #1E6FD9, #1558B0)",
              border: "1px solid rgba(30,111,217,0.4)",
              borderRadius: 12,
              color: "#ffffff",
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              boxShadow: loading ? "none" : "0 4px 20px rgba(30,111,217,0.3)",
              fontFamily: "inherit",
            }}
            onMouseEnter={e => {
              if (!loading) {
                (e.target as HTMLButtonElement).style.transform = "translateY(-1px)";
                (e.target as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(30,111,217,0.4)";
              }
            }}
            onMouseLeave={e => {
              (e.target as HTMLButtonElement).style.transform = "translateY(0)";
              (e.target as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(30,111,217,0.3)";
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 18, height: 18,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                  flexShrink: 0,
                }} />
                Connecting…
              </>
            ) : (
              <>
                <AtlassianLogo />
                Continue with Atlassian
              </>
            )}
          </button>

          {/* Divider */}
          <div style={{
            marginTop: 24, paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Feature icon="🔒" text="Your credentials are never stored" />
              <Feature icon="⚡" text="Real-time sync with your Jira board" />
              <Feature icon="🔄" text="All task changes reflect in Jira instantly" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: "center", fontSize: 12, color: "#334155",
          marginTop: 24,
        }}>
          IOTA Technologies · Powered by Jira Cloud
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function Feature({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ fontSize: 12, color: "#64748b" }}>{text}</span>
    </div>
  );
}

function AtlassianLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
      <path
        d="M11.3 14.5C11.1 14.3 10.8 14.3 10.6 14.5L5.7 20.5C5.5 20.7 5.6 21 5.9 21H13.4C13.6 21 13.8 20.9 13.9 20.7C15.1 18.4 14.6 16.1 11.3 14.5Z"
        fill="white"
      />
      <path
        d="M15.9 4.2C13.1 8.8 13.4 13.7 16.2 17.4L20.1 21H26.1C26.4 21 26.5 20.7 26.3 20.5C26.3 20.5 17.9 7.1 17.2 6C16.8 5.3 16.3 4.2 15.9 4.2Z"
        fill="white"
      />
    </svg>
  );
}