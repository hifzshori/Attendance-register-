import type { Request, Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { password } = await req.json();

    if (!password) {
      return new Response("Password required", { status: 400 });
    }

    // Check against environment variable or fallback for demo purposes
    // In production, set TEACHER_PASSWORD in Netlify Site Settings
    const validPassword = process.env.TEACHER_PASSWORD || "school123";

    if (password === validPassword) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: "Invalid password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

  } catch (error) {
    console.error("Login Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};