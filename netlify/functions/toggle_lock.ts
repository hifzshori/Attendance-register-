import { getStore } from "@netlify/blobs";
import type { Request, Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { code, isLocked, senderId } = await req.json();

    if (!code || isLocked === undefined || !senderId) {
      return new Response("Missing required parameters", { status: 400 });
    }

    // Only teacher can lock/unlock
    if (senderId !== 'teacher') {
        return new Response("Unauthorized", { status: 403 });
    }

    const store = getStore("attendance_shares");
    const data: any = await store.get(code, { type: "json" });

    if (!data) {
      return new Response("Class not found", { status: 404 });
    }

    await store.setJSON(code, {
      ...data,
      isChatLocked: isLocked
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Toggle Lock Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};