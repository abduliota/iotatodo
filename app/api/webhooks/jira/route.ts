import { NextRequest, NextResponse } from "next/server";

/**
 * Jira sends POST requests here when issues change.
 * Register this URL in your Jira project:
 *   Settings → System → WebHooks → Create webhook
 *   URL: https://your-domain.com/api/webhooks/jira
 *   Events: Issue created, updated, deleted
 *
 * In dev, expose via: npx ngrok http 3000
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const event = payload.webhookEvent as string;

    console.log("[Jira Webhook]", event, payload.issue?.key);

    // Here you could:
    // - Revalidate TanStack Query cache via revalidateTag (Next.js 14)
    // - Emit a Server-Sent Event to connected clients
    // - Store activity in Supabase
    // - Send Slack / email notifications

    switch (event) {
      case "jira:issue_created":
        // TODO: broadcast new issue to connected clients
        break;
      case "jira:issue_updated":
        // TODO: broadcast updated issue
        break;
      case "jira:issue_deleted":
        // TODO: broadcast deletion
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
