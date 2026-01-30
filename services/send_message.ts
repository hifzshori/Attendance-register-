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

    // 2. Check Lock State
    // If locked, only teacher can send messages.
    // 'teacher' is the string literal used for the teacher session ID in this app.
    // In a production app, this would check a signed token.
    if (data.isChatLocked && message.senderId !== 'teacher') {
       return new Response("Chat is locked by teacher", { status: 403 });
    }

    // 3. Append message
    const messages = data.messages || [];
    messages.push(message);

    // 4. Save back
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