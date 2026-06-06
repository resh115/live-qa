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

  useEffect(() => {
    fetchQuestions();
    fetchPoll();
  }, []);

  async function fetchQuestions() {
    const { data } = await supabase
      .from("questions")
      .select("*");

    if (data) {
      setQuestions(
        [...data].sort((a, b) => b.votes - a.votes)
      );
    }
  }

  async function fetchPoll() {
    const { data } = await supabase
      .from("polls")
      .select("*")
      .limit(1)
      .single();

    if (data) {
      setPoll(data);
    }
  }

  async function addQuestion() {
    if (!question.trim()) return;

    const { error } = await supabase
      .from("questions")
      .insert({
        text: question,
        votes: 0,
      });

    if (!error) {
      setQuestion("");
      fetchQuestions();
    }
  }

  async function upvote(id: string, votes: number) {
    const { error } = await supabase
      .from("questions")
      .update({
        votes: votes + 1,
      })
      .eq("id", id);

    if (!error) {
      fetchQuestions();
    }
  }

  async function vote(option: number) {
    if (!poll) return;

    const field = `votes${option}`;

    const { error } = await supabase
      .from("polls")
      .update({
        [field]: poll[field] + 1,
      })
      .eq("id", poll.id);

    if (!error) {
      fetchPoll();
    }
  }

  const filteredQuestions = questions.filter((q) =>
    q.text.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-10">

        <h1 className="text-5xl font-bold mb-2">
          Live Q&A
        </h1>

        <p className="text-zinc-400 mb-8">
          Ask questions, vote, and participate in polls.
        </p>

        <div className="flex gap-3 mb-4">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none"
          />

          <button
            onClick={addQuestion}
            className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl"
          >
            Ask
          </button>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 mb-8"
        />

        {/* POLL SECTION */}

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
                className="absolute left-0 top-0 h-full bg-blue-500/40 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />

              <div className="relative flex justify-between items-center p-4">
                <span>{option.text}</span>
                <span className="font-semibold">
                  {Math.round(percentage)}%
                </span>
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
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex gap-5"
            >
              <button
                onClick={() => upvote(q.id, q.votes)}
                className="min-w-[70px] h-[70px] bg-zinc-800 rounded-xl flex flex-col items-center justify-center"
              >
                <span>▲</span>
                <span>{q.votes}</span>
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