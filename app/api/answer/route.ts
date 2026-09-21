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
  max_completion_tokens: 150,
  reasoning_effort: "low",
});
