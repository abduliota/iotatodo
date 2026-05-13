import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAssignableUsers } from "@/lib/jira";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken || !session?.cloudId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const users = await getAssignableUsers(session.cloudId, session.accessToken);
    return NextResponse.json({ users });
  } catch (err: any) {
    console.error("[users GET]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}