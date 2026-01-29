import { getStore } from "@netlify/blobs";
import type { Request, Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const data = await req.json();
    
    // Basic Validation
    if (!data || !data.id || !data.name) {
      return new Response("Invalid class data", { status: 400 });
    }

    // Generate a short 6-character code
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const store = getStore("attendance_shares");
    
    // Store data with the code embedded.
    // We remove the 'expiresAt' logic to make it lifetime.
    // If a teacher shares again, a new code is generated, effectively "invalidating" the old one
    // in the sense that the teacher will be looking at the new code's data stream.
    await store.setJSON(code, {
      ...data,
      shareCode: code, // Embed the code so we know this is the valid one
      _sharedAt: Date.now()
    });

    return new Response(JSON.stringify({ 
      code,
      // No expiresAt returned implies lifetime
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Share Function Error:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to generate code. Ensure Netlify Blobs is configured." 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};