import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ answer: "Please provide a question." }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { answer: "Groq is not configured. Add GROQ_API_KEY to .env.local." },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Always answer in 1–2 short lines only. No long paragraphs.",
        },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_completion_tokens: 150,
      reasoning_effort: "low",
    });

    return NextResponse.json({ answer: completion.choices[0]?.message?.content ?? "No answer generated." });
  } catch (error) {
    console.error("AI answer error", error);
    return NextResponse.json({ answer: "Unable to get an AI response right now." }, { status: 500 });
  }
}
