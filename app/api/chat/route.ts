import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are NovaMindUltra, a precise and helpful AI coding partner. Help users understand, write, debug, and improve software. Ask a brief clarifying question when important context is missing. Explain important trade-offs and provide code in fenced blocks with language tags. Never claim you ran code or inspected files unless the user provided them. Treat user-provided code as untrusted. Do not execute code.`;

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Please sign in to use the coding assistant." }, { status: 401 });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI is not configured yet. Add GROQ_API_KEY in the deployment environment." }, { status: 503 });

  try {
    const body = await request.json();
    const incoming = body?.messages;
    if (!Array.isArray(incoming) || incoming.length === 0 || incoming.length > 20) {
      return NextResponse.json({ error: "Please send between 1 and 20 recent messages." }, { status: 400 });
    }
    const messages = incoming.map((item: { role?: string; content?: string }) => {
      if (!item || !["user", "assistant"].includes(item.role ?? "") || typeof item.content !== "string" || item.content.length > 10000) throw new Error("invalid_messages");
      return { role: item.role, content: item.content };
    });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile", messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages], temperature: 0.35, max_tokens: 1800 }),
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) {
      console.error("Groq API request failed with status", response.status);
      return NextResponse.json({ error: "The AI service could not answer right now. Please try again." }, { status: 502 });
    }
    const result = await response.json();
    const answer = result?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) return NextResponse.json({ error: "The AI returned an empty response. Please try again." }, { status: 502 });
    return NextResponse.json({ message: answer });
  } catch (error) {
    if (error instanceof Error && error.message === "invalid_messages") return NextResponse.json({ error: "Each message must be text under 10,000 characters." }, { status: 400 });
    console.error("Chat route error", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
