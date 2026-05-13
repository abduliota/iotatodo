import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getToken } from "next-auth/jwt";
import { type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const token   = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  return NextResponse.json({
    hasSession:    !!session,
    hasToken:      !!token,
    sessionData:   session  ? { 
      user:      session.user, 
      cloudId:   session.cloudId,
      siteName:  session.siteName,
      hasAccessToken: !!session.accessToken,
    } : null,
    tokenData: token ? {
      hasAccessToken:  !!token.accessToken,
      hasCloudId:      !!token.cloudId,
      hasRefreshToken: !!token.refreshToken,
      expiresAt:       token.expiresAt,
      error:           (token as any).error ?? null,
    } : null,
    env: {
      NEXTAUTH_URL:        process.env.NEXTAUTH_URL,
      PROJECT_KEY:         process.env.NEXT_PUBLIC_JIRA_PROJECT_KEY,
      HAS_SECRET:          !!process.env.NEXTAUTH_SECRET,
      HAS_CLIENT_ID:       !!process.env.ATLASSIAN_CLIENT_ID,
      HAS_CLIENT_SECRET:   !!process.env.ATLASSIAN_CLIENT_SECRET,
    },
  }, { status: 200 });
}