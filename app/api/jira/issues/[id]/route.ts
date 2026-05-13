import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getIssue, updateIssue, deleteIssue, addComment } from "@/lib/jira";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const issue = await getIssue(session.cloudId, session.accessToken, params.id);
    return NextResponse.json({ issue });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const payload = await req.json();

    // Handle comment separately
    if (payload.comment) {
      const comment = await addComment(session.cloudId, session.accessToken, params.id, payload.comment);
      return NextResponse.json({ comment });
    }

    await updateIssue(session.cloudId, session.accessToken, params.id, payload);
    const issue = await getIssue(session.cloudId, session.accessToken, params.id);
    return NextResponse.json({ issue });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await deleteIssue(session.cloudId, session.accessToken, params.id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
