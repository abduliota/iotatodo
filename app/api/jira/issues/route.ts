import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getIssues, createIssue } from "@/lib/jira";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken || !session?.cloudId) {
    return NextResponse.json({ error: "Unauthorized", session: !!session, cloudId: session?.cloudId }, { status: 401 });
  }
  const jql = req.nextUrl.searchParams.get("jql") ?? undefined;
  try {
    const issues = await getIssues(session.cloudId, session.accessToken, jql);
    return NextResponse.json({ issues });
  } catch (err: any) {
    console.error("[issues GET]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken || !session?.cloudId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const payload = await req.json();
    const issue = await createIssue(session.cloudId, session.accessToken, payload);
    return NextResponse.json({ issue }, { status: 201 });
  } catch (err: any) {
    console.error("[issues POST]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}