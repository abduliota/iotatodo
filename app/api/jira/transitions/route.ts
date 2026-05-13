import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTransitions, transitionIssue } from "@/lib/jira";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const issueId = req.nextUrl.searchParams.get("issueId");
  if (!issueId) return NextResponse.json({ error: "issueId required" }, { status: 400 });
  try {
    const transitions = await getTransitions(session.cloudId, session.accessToken, issueId);
    return NextResponse.json({ transitions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { issueId, transitionId } = await req.json();
    await transitionIssue(session.cloudId, session.accessToken, issueId, transitionId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
