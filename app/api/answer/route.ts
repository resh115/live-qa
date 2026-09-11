import Groq from "groq-sdk";

export async function POST(req: Request) {
  try {
    // Get message from request
    const { message } = await req.json();

    // Check message
    if (!message) {
      return Response.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Check API key
    if (!process.env.GROQ_API_KEY) {
      return Response.json(
        { error: "Missing GROQ_API_KEY" },
        { status: 500 }
      );
    }

    // Create Groq client
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    // Send request to Groq
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",

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

      // Prevent unnecessary long responses
      max_completion_tokens: 150,

      // Do not return reasoning content
      include_reasoning: false,
    });

    // Get AI response
    const answer =
      completion.choices?.[0]?.message?.content || "No response";

    // Return response
    return Response.json({
      answer: answer.trim(),
    });

  } catch (err: any) {
    console.error("🔥 GROQ ERROR:", err);

    return Response.json(
      {
        error: err?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
