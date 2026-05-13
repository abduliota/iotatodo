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
      clientId: process.env.ATLASSIAN_CLIENT_ID!,
      clientSecret: process.env.ATLASSIAN_CLIENT_SECRET!,

      authorization: {
        url: "https://auth.atlassian.com/authorize",
        params: {
          audience: "api.atlassian.com",
          scope:
            "read:jira-work write:jira-work read:jira-user manage:jira-project offline_access",
          prompt: "consent",
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
          name:  profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    },
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      // On first sign-in, grab access token + cloud ID
      if (account) {
        token.accessToken  = account.access_token  as string;
        token.refreshToken = account.refresh_token as string;
        token.expiresAt    = account.expires_at    as number;

        // Fetch accessible Jira cloud instances
        const resourcesRes = await fetch(
          "https://api.atlassian.com/oauth/token/accessible-resources",
          { headers: { Authorization: `Bearer ${account.access_token}` } }
        );
        const resources = await resourcesRes.json();
        // Use the first accessible Jira site
        if (resources?.[0]) {
          token.cloudId  = resources[0].id;
          token.siteUrl  = resources[0].url;
          token.siteName = resources[0].name;
        }

        if (profile) {
          token.accountId = (profile as any).account_id;
        }
      }

      // Refresh access token if expired
      if (Date.now() < (token.expiresAt as number) * 1000) return token;

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
        const refreshed = await res.json();
        return {
          ...token,
          accessToken:  refreshed.access_token,
          expiresAt:    Math.floor(Date.now() / 1000) + refreshed.expires_in,
          refreshToken: refreshed.refresh_token ?? token.refreshToken,
        };
      } catch {
        return { ...token, error: "RefreshTokenError" };
      }
    },

    async session({ session, token }) {
      session.accessToken    = token.accessToken as string;
      session.cloudId        = token.cloudId     as string;
      session.siteUrl        = token.siteUrl     as string;
      session.siteName       = token.siteName    as string;
      session.user.accountId = token.accountId   as string;
      return session;
    },
  },
};

// Extend next-auth types
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