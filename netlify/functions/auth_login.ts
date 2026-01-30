import { getStore } from "@netlify/blobs";
import type { Request, Context } from "@netlify/functions";
import * as crypto from "crypto";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password required" }), { status: 400 });
    }

    const userStore = getStore("users");
    const normalizedEmail = email.toLowerCase().trim();
    
    // Fetch user
    const user: any = await userStore.get(normalizedEmail, { type: "json" });
    
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
    }

    // Verify Password
    const verifyHash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex');
    
    if (verifyHash !== user.hash) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
    }

    // Create Session Token
    const token = crypto.randomBytes(32).toString('hex');
    const sessionStore = getStore("sessions");
    
    // Store session (valid for 30 days)
    await sessionStore.setJSON(token, {
      userId: user.id,
      email: user.email,
      name: user.name,
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) 
    });

    return new Response(JSON.stringify({ 
      success: true, 
      token,
      user: { name: user.name, email: user.email } 
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Login Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
};