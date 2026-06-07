"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Question {
  id: string;
  text: string;
  votes: number;
}

export default function Home() {
  const [question, setQuestion] = useState("");
  const [search, setSearch] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [poll, setPoll] = useState<any>(null);

  const [aiAnswer, setAiAnswer] = useState<{ [key: string]: string }>({});
  const [loadingAI, setLoadingAI] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
    fetchPoll();
  }, []);

  async function fetchQuestions() {
    const { data } = await supabase.from("questions").select("*");

    if (data) {
      setQuestions([...data].sort((a, b) => b.votes - a.votes));
    }
  }

  async function fetchPoll() {
    const { data } = await supabase
      .from("polls")
      .select("*")
      .limit(1)
      .single();

    if (data) setPoll(data);
  }

  async function addQuestion() {
    if (!question.trim()) return;

    const { error } = await supabase.from("questions").insert({
      text: question,
      votes: 0,
    });

    if (!error) {
      setQuestion("");
      fetchQuestions();
    }
  }

  async function upvote(id: string, votes: number) {
    await supabase
      .from("questions")
      .update({ votes: votes + 1 })
      .eq("id", id);

    fetchQuestions();
  }

  async function vote(option: number) {
    if (!poll) return;

    const field = `votes${option}`;

    await supabase
      .from("polls")
      .update({
        [field]: poll[field] + 1,
      })
      .eq("id", poll.id);

    fetchPoll();
  }

  // 🤖 AI FUNCTION
  async function askAI(id: string, text: string) {
    setLoadingAI(id);

    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      setAiAnswer((prev) => ({
        ...prev,
        [id]: data.answer,
      }));
    } catch (err) {
      setAiAnswer((prev) => ({
        ...prev,
        [id]: "Error getting AI response",
      }));
    }

    setLoadingAI(null);
  }

  const filteredQuestions = questions.filter((q) =>
    q.text.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-10">

        <h1 className="text-5xl font-bold mb-2">
          Live Q&A + AI
        </h1>

        <p className="text-zinc-400 mb-8">
          Ask questions, vote, get AI answers instantly.
        </p>

        {/* ASK QUESTION */}
        <div className="flex gap-3 mb-4">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
          />

          <button
            onClick={addQuestion}
            className="bg-blue-600 px-6 py-3 rounded-xl"
          >
            Ask
          </button>
        </div>

        {/* SEARCH */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 mb-8"
        />

        {/* POLL */}
        {poll && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">
              📊 {poll.question}
            </h2>

            <div className="space-y-3">
              {[
                { text: poll.option1, votes: poll.votes1, num: 1 },
                { text: poll.option2, votes: poll.votes2, num: 2 },
                poll.option3
                  ? { text: poll.option3, votes: poll.votes3, num: 3 }
                  : null,
                poll.option4
                  ? { text: poll.option4, votes: poll.votes4, num: 4 }
                  : null,
              ]
                .filter(Boolean)
                .map((option: any) => {
                  const totalVotes =
                    poll.votes1 +
                    poll.votes2 +
                    poll.votes3 +
                    poll.votes4;

                  const percentage =
                    totalVotes === 0
                      ? 0
                      : (option.votes / totalVotes) * 100;

                  return (
                    <button
                      key={option.num}
                      onClick={() => vote(option.num)}
                      className="relative w-full overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800"
                    >
                      <div
                        className="absolute left-0 top-0 h-full bg-blue-500/40"
                        style={{ width: `${percentage}%` }}
                      />

                      <div className="relative flex justify-between p-4">
                        <span>{option.text}</span>
                        <span>{Math.round(percentage)}%</span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* QUESTIONS */}
        <div className="space-y-4">
          {filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
            >
              <div className="flex gap-5">

                {/* VOTE */}
                <button
                  onClick={() => upvote(q.id, q.votes)}
                  className="min-w-[70px] h-[70px] bg-zinc-800 rounded-xl flex flex-col items-center justify-center"
                >
                  ▲ {q.votes}
                </button>

                {/* CONTENT */}
                <div className="flex-1">

                  <p className="text-lg">{q.text}</p>

                  {/* AI BUTTON */}
                  <button
                    onClick={() => askAI(q.id, q.text)}
                    className="mt-3 px-4 py-2 bg-purple-600 rounded-lg"
                  >
                    🤖 Ask AI
                  </button>

                  {/* LOADING */}
                  {loadingAI === q.id && (
                    <p className="text-sm text-zinc-400 mt-2">
                      AI thinking...
                    </p>
                  )}

                  {/* AI ANSWER */}
                  {aiAnswer[q.id] && (
                    <div className="mt-3 p-3 bg-zinc-800 rounded-lg text-green-300">
                      {aiAnswer[q.id]}
                    </div>
                  )}

                </div>

              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}