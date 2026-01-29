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

    // Generate a short 6-character code (Uppercase + Numbers, confusing chars removed)
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Connect to Netlify Blobs store called "attendance_shares"
    // Note: Requires @netlify/blobs package and Netlify Blobs enabled on the site
    const store = getStore("attendance_shares");
    
    // Store data. We also store a timestamp to handle expiry validation manually if needed,
    // though for this demo we just store it.
    await store.setJSON(code, {
      ...data,
      _sharedAt: Date.now()
    });

    // Return the code
    return new Response(JSON.stringify({ 
      code, 
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour expiry visual
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