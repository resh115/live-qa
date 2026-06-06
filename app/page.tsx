"use client";

import { useState } from "react";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [search, setSearch] = useState("");

  const [questions, setQuestions] = useState([
    {
      id: 1,
      text: "How do I deploy a Next.js app?",
      votes: 3,
    },
  ]);

  const addQuestion = () => {
    if (!question.trim()) return;

    setQuestions([
      {
        id: Date.now(),
        text: question,
        votes: 0,
      },
      ...questions,
    ]);

    setQuestion("");
  };

  const upvote = (id: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === id ? { ...q, votes: q.votes + 1 } : q
      )
    );
  };

  const filtered = questions.filter((q) =>
    q.text.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-4xl font-bold mb-2">
          Live Q&A
        </h1>

        <p className="text-zinc-400 mb-8">
          Ask questions and vote for the best ones.
        </p>

        <div className="flex gap-3 mb-5">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-blue-500 transition"
          />

          <button
            onClick={addQuestion}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition font-semibold"
          >
            Ask
          </button>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions..."
          className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 outline-none focus:border-blue-500 transition mb-8"
        />

        <div className="space-y-4">
          {filtered.map((q) => (
            <div
              key={q.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex gap-5 hover:border-zinc-700 transition"
            >
              <button
                onClick={() => upvote(q.id)}
                className="min-w-[70px] h-[70px] rounded-xl bg-zinc-800 hover:bg-zinc-700 transition flex flex-col items-center justify-center"
              >
                <span className="text-xl">▲</span>
                <span className="font-bold">{q.votes}</span>
              </button>

              <div className="flex items-center text-lg">
                {q.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}