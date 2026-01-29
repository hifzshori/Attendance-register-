import { getStore } from "@netlify/blobs";
import type { Request, Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code")?.toUpperCase();

  if (!code) {
    return new Response("Code is required", { status: 400 });
  }

  try {
    const store = getStore("attendance_shares");
    const data: any = await store.get(code, { type: "json" });

    if (!data) {
      return new Response("Code not found or expired", { status: 404 });
    }

    // Check Expiry (60 minutes)
    const ONE_HOUR = 60 * 60 * 1000;
    if (Date.now() - data._sharedAt > ONE_HOUR) {
        // Optionally delete expired data
        await store.delete(code);
        return new Response("Code expired", { status: 410 });
    }

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("View Function Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};