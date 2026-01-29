import { getStore } from "@netlify/blobs";
import type { Request, Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { code, messageId } = await req.json();

    if (!code || !messageId) {
      return new Response("Missing code or messageId", { status: 400 });
    }

    const store = getStore("attendance_shares");
    const data: any = await store.get(code, { type: "json" });

    if (!data) {
      return new Response("Class not found", { status: 404 });
    }

    const messages = data.messages || [];
    const updatedMessages = messages.filter((m: any) => m.id !== messageId);

    await store.setJSON(code, {
      ...data,
      messages: updatedMessages
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Delete Message Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};