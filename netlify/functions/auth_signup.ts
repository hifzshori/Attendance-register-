import { getStore } from "@netlify/blobs";
import type { Request, Context } from "@netlify/functions";
import * as crypto from "crypto";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return new Response(JSON.stringify({ error: "All fields are required" }), { status: 400 });
    }

    const store = getStore("users");
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existingUser = await store.get(normalizedEmail);
    if (existingUser) {
      return new Response(JSON.stringify({ error: "Email already registered" }), { status: 409 });
    }

    // Hash password (using simple SHA-256 with salt for this environment)
    // In a full node environment, use scrypt or bcrypt. 
    // Here we use crypto.pbkdf2Sync for better security than simple sha256.
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

    const newUser = {
      id: crypto.randomUUID(),
      name,
      email: normalizedEmail,
      hash,
      salt,
      createdAt: Date.now()
    };

    // Store user by email
    await store.setJSON(normalizedEmail, newUser);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Signup Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
};