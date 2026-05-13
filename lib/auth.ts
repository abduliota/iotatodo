import type { NextAuthOptions } from "next-auth";

const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith("https://");
const cookiePrefix   = useSecureCookies ? "__Secure-" : "";
const hostName       = process.env.NEXTAUTH_URL
  ? new URL(process.env.NEXTAUTH_URL).hostname
  : "localhost";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages:   { signIn: "/login" },

  // ── Explicit cookie config for HTTPS / Render ─────────────────────────────
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path:     "/",
        secure:   useSecureCookies,
        domain:   hostName === "localhost" ? undefined : hostName,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path:     "/",
        secure:   useSecureCookies,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path:     "/",
        secure:   useSecureCookies,
      },
    },
  },

  providers: [
    {
      id:           "atlassian",
      name:         "Atlassian",
      type:         "oauth",
      clientId:     process.env.ATLASSIAN_CLIENT_ID!,
      clientSecret: process.env.ATLASSIAN_CLIENT_SECRET!,

      authorization: {
        url: "https://auth.atlassian.com/authorize",
        params: {
          audience:      "api.atlassian.com",
          scope:         "read:jira-work write:jira-work read:jira-user manage:jira-project offline_access",
          prompt:        "consent",
          response_type: "code",
        },
      },

      token: "https://auth.atlassian.com/oauth/token",

      userinfo: {
        url: "https://api.atlassian.com/me",
        async request({ tokens }) {
          const res = await fetch("https://api.atlassian.com/me", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          return res.json();
        },
      },

      profile(profile) {
        return {
          id:    profile.account_id,
          name:  profile.name          ?? profile.display_name ?? "User",
          email: profile.email         ?? "",
          image: profile.picture       ?? profile.avatar_url   ?? "",
        };
      },
    },
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      // ── First sign-in ────────────────────────────────────────────────────
      if (account) {
        token.accessToken  = account.access_token  as string;
        token.refreshToken = account.refresh_token as string;
        token.expiresAt    = account.expires_at    as number;

        if (profile) {
          token.accountId = (profile as any).account_id ?? "";
        }

        try {
          const res = await fetch(
            "https://api.atlassian.com/oauth/token/accessible-resources",
            { headers: { Authorization: `Bearer ${account.access_token}` } }
          );
          const resources = await res.json();
          if (Array.isArray(resources) && resources.length > 0) {
            token.cloudId  = resources[0].id;
            token.siteUrl  = resources[0].url;
            token.siteName = resources[0].name;
          }
        } catch (err) {
          console.error("[NextAuth] accessible-resources failed:", err);
        }

        return token; // ← critical: return early, skip refresh block
      }

      // ── Subsequent requests: refresh if expired ──────────────────────────
      const expiresAt  = token.expiresAt as number | undefined;
      if (expiresAt && Date.now() < expiresAt * 1000) return token;
      if (!token.refreshToken) return { ...token, error: "RefreshTokenError" };

      try {
        const res = await fetch("https://auth.atlassian.com/oauth/token", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type:    "refresh_token",
            client_id:     process.env.ATLASSIAN_CLIENT_ID,
            client_secret: process.env.ATLASSIAN_CLIENT_SECRET,
            refresh_token: token.refreshToken,
          }),
        });
        if (!res.ok) throw new Error(`Refresh ${res.status}`);
        const r = await res.json();
        return {
          ...token,
          accessToken:  r.access_token,
          refreshToken: r.refresh_token ?? token.refreshToken,
          expiresAt:    Math.floor(Date.now() / 1000) + (r.expires_in ?? 3600),
        };
      } catch (err) {
        console.error("[NextAuth] Token refresh failed:", err);
        return { ...token, error: "RefreshTokenError" };
      }
    },

    async session({ session, token }) {
      session.accessToken    = token.accessToken  as string;
      session.cloudId        = (token.cloudId     as string) ?? "";
      session.siteUrl        = (token.siteUrl     as string) ?? "";
      session.siteName       = (token.siteName    as string) ?? "";
      session.user.accountId = (token.accountId   as string) ?? "";
      if ((token as any).error) (session as any).error = (token as any).error;
      return session;
    },
  },
};

// ── Type augmentation ─────────────────────────────────────────────────────────
declare module "next-auth" {
  interface Session {
    accessToken: string;
    cloudId:     string;
    siteUrl:     string;
    siteName:    string;
    user: {
      name:      string;
      email:     string;
      image:     string;
      accountId: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken:  string;
    refreshToken: string;
    expiresAt:    number;
    cloudId:      string;
    siteUrl:      string;
    siteName:     string;
    accountId:    string;
  }
}