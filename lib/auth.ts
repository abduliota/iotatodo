import type { NextAuthOptions } from "next-auth";
import { encode, decode } from "next-auth/jwt";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },

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
          scope:         "read:jira-work write:jira-work read:jira-user manage:jira-project offline_access read:me read:account read:board-scope:jira-software write:board-scope:jira-software read:sprint:jira-software write:sprint:jira-software",
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
          name:  profile.name ?? profile.display_name ?? profile.nickname ?? "User",
          email: profile.email ?? "",
          image: profile.picture ?? profile.avatar_url ?? "",
        };
      },
    },
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        // Only store what we absolutely need — keep token small
        token.accessToken  = account.access_token  as string;
        token.refreshToken = account.refresh_token as string;
        token.expiresAt    = account.expires_at    as number;

        // Get name/email from profile
        if (profile) {
          const p = profile as any;
          token.accountId  = p.account_id  ?? "";
          token.userName   = p.name ?? p.display_name ?? p.nickname ?? "User";
          token.userEmail  = p.email ?? "";
          token.userImage  = p.picture ?? p.avatar_url ?? "";
        }

        // Fetch cloudId — store only essentials
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
          console.error("[auth] accessible-resources failed:", err);
        }

        return token;
      }

      // Refresh if expired
      const expiresAt = token.expiresAt as number | undefined;
      if (expiresAt && Date.now() < expiresAt * 1000) return token;
      if (!token.refreshToken) return { ...token, error: "NoRefreshToken" };

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
        console.error("[auth] Token refresh failed:", err);
        return { ...token, error: "RefreshTokenError" };
      }
    },

    async session({ session, token }) {
      session.accessToken    = token.accessToken  as string;
      session.cloudId        = (token.cloudId     as string) ?? "";
      session.siteUrl        = (token.siteUrl     as string) ?? "";
      session.siteName       = (token.siteName    as string) ?? "";
      session.user.accountId = (token.accountId   as string) ?? "";
      // Fix empty name/email
      session.user.name      = (token.userName    as string) || session.user.name || "User";
      session.user.email     = (token.userEmail   as string) || session.user.email || "";
      session.user.image     = (token.userImage   as string) || session.user.image || "";
      return session;
    },
  },

  // ── Slim down the JWT to avoid the 4096-byte cookie limit ─────────────────
  jwt: {
    encode: async ({ token, secret, maxAge }) => {
      // Strip fields we don't need to reduce cookie size
      const slim = {
        accessToken:  token?.accessToken,
        refreshToken: token?.refreshToken,
        expiresAt:    token?.expiresAt,
        cloudId:      token?.cloudId,
        siteUrl:      token?.siteUrl,
        siteName:     token?.siteName,
        accountId:    token?.accountId,
        userName:     token?.userName,
        userEmail:    token?.userEmail,
        userImage:    token?.userImage,
        // NextAuth internals
        iat:          token?.iat,
        exp:          token?.exp,
        jti:          token?.jti,
      };
      return encode({ token: slim as any, secret: secret as string, maxAge });
    },
    decode: async ({ token, secret }) => {
      return decode({ token, secret: secret as string });
    },
  },
};

declare module "next-auth" {
  interface Session {
    accessToken: string;
    cloudId:     string;
    siteUrl:     string;
    siteName:    string;
    user: { name: string; email: string; image: string; accountId: string };
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
    userName:     string;
    userEmail:    string;
    userImage:    string;
  }
}