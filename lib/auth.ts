import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },

  providers: [
    {
      id: "atlassian",
      name: "Atlassian",
      type: "oauth",
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
          name:  profile.name  ?? profile.display_name ?? "User",
          email: profile.email ?? "",
          image: profile.picture ?? profile.avatar_url ?? "",
        };
      },
    },
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      // ── First sign-in: account is present ────────────────────────────────
      if (account) {
        token.accessToken  = account.access_token  as string;
        token.refreshToken = account.refresh_token as string;
        token.expiresAt    = account.expires_at    as number;

        if (profile) {
          token.accountId = (profile as any).account_id ?? "";
        }

        // Fetch the user's accessible Jira cloud instance
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
          console.error("[NextAuth] Failed to fetch accessible resources:", err);
          // Non-fatal — token still valid, cloudId just won't be set
        }

        // ★ CRITICAL: return here so we don't fall into the refresh block
        return token;
      }

      // ── Subsequent requests: check if access token needs refreshing ───────
      const expiresAt = token.expiresAt as number | undefined;
      const notExpired = expiresAt && Date.now() < expiresAt * 1000;
      if (notExpired) return token;

      // Token expired — try to refresh
      if (!token.refreshToken) {
        console.error("[NextAuth] No refresh token available");
        return { ...token, error: "RefreshTokenError" };
      }

      try {
        const res = await fetch("https://auth.atlassian.com/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type:    "refresh_token",
            client_id:     process.env.ATLASSIAN_CLIENT_ID,
            client_secret: process.env.ATLASSIAN_CLIENT_SECRET,
            refresh_token: token.refreshToken,
          }),
        });

        if (!res.ok) throw new Error(`Refresh failed: ${res.status}`);

        const refreshed = await res.json();
        return {
          ...token,
          accessToken:  refreshed.access_token,
          refreshToken: refreshed.refresh_token ?? token.refreshToken,
          expiresAt:    Math.floor(Date.now() / 1000) + (refreshed.expires_in ?? 3600),
        };
      } catch (err) {
        console.error("[NextAuth] Token refresh error:", err);
        return { ...token, error: "RefreshTokenError" };
      }
    },

    async session({ session, token }) {
      session.accessToken    = token.accessToken as string;
      session.cloudId        = (token.cloudId  as string) ?? "";
      session.siteUrl        = (token.siteUrl  as string) ?? "";
      session.siteName       = (token.siteName as string) ?? "";
      session.user.accountId = (token.accountId as string) ?? "";
      if ((token as any).error) {
        (session as any).error = (token as any).error;
      }
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