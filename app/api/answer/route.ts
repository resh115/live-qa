import Groq from "groq-sdk";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return Response.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return Response.json(
        { error: "Missing GROQ_API_KEY" },
        { status: 500 }
      );
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Always answer in 1–2 short lines only. No long paragraphs.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
    });

    const answer =
      completion.choices?.[0]?.message?.content || "No response";

    return Response.json({
      answer,
    });

  } catch (err: any) {
    console.log("🔥 GROQ ERROR:", err);

    return Response.json(
      {
        error: err.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}