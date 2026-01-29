import { getStore } from "@netlify/blobs";
import type { Request, Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { code, message } = await req.json();

    if (!code || !message) {
      return new Response("Missing code or message", { status: 400 });
    }

    const store = getStore("attendance_shares");
    
    // 1. Get current state
    const data: any = await store.get(code, { type: "json" });
    if (!data) {
      return new Response("Class not found", { status: 404 });
    }

    // 2. Append message
    const messages = data.messages || [];
    messages.push(message);

    // 3. Save back (Optimistic locking not implemented for simplicity, but acceptable for low volume)
    await store.setJSON(code, {
      ...data,
      messages
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Send Message Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};