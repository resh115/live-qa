"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Question = { id: string; text: string; votes: number };
type Poll = {
  id: string;
  question: string;
  option1: string;
  option2: string;
  option3?: string;
  option4?: string;
  votes1: number;
  votes2: number;
  votes3: number;
  votes4: number;
};
type RankingOption = { id: string; label: string };
type QuizOption = { id: string; label: string; is_correct?: boolean };
type Tab = "overview" | "ranking" | "reactions" | "wordcloud" | "quiz" | "rating";

const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "ranking", label: "Live Ranking" },
  { id: "reactions", label: "Reactions" },
  { id: "wordcloud", label: "Word Cloud" },
  { id: "quiz", label: "Quiz" },
  { id: "rating", label: "Rating" },
];

const reactionOptions = [
  { key: "like", label: "Like", symbol: "👍" },
  { key: "love", label: "Love", symbol: "❤️" },
  { key: "laugh", label: "Laugh", symbol: "😂" },
  { key: "fire", label: "Fire", symbol: "🔥" },
] as const;

function getParticipantId() {
  if (typeof window === "undefined") return "server";
  const key = "live-qa-participant-id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.localStorage.setItem(key, id);
  return id;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [participantId, setParticipantId] = useState("");
  const [question, setQuestion] = useState("");
  const [search, setSearch] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [aiAnswer, setAiAnswer] = useState<Record<string, string>>({});
  const [loadingAI, setLoadingAI] = useState<string | null>(null);

  const [rankingId, setRankingId] = useState<string | null>(null);
  const [rankingTitle, setRankingTitle] = useState("Live Ranking");
  const [rankingOptions, setRankingOptions] = useState<RankingOption[]>([]);
  const [rankingOrder, setRankingOrder] = useState<string[]>([]);
  const [rankingSubmitted, setRankingSubmitted] = useState(false);

  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});

  const [word, setWord] = useState("");
  const [words, setWords] = useState<{ word: string; count: number }[]>([]);

  const [quizId, setQuizId] = useState<string | null>(null);
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizOptions, setQuizOptions] = useState<QuizOption[]>([]);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<boolean | null>(null);

  const [rating, setRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  const fetchQuestions = useCallback(async () => {
    const { data } = await supabase.from("questions").select("*");
    if (data) setQuestions([...data].sort((a, b) => b.votes - a.votes));
  }, []);

  const fetchPoll = useCallback(async () => {
    const { data } = await supabase.from("polls").select("*").limit(1).single();
    if (data) setPoll(data as Poll);
  }, []);

  const fetchRanking = useCallback(async () => {
    const { data: ranking } = await supabase.from("rankings").select("*").order("created_at", { ascending: true }).limit(1).single();
    if (!ranking) return;
    setRankingId(ranking.id);
    setRankingTitle(ranking.title);
    const { data: options } = await supabase.from("ranking_options").select("id,label").eq("ranking_id", ranking.id).order("created_at");
    const list = (options ?? []) as RankingOption[];
    setRankingOptions(list);
    setRankingOrder((current) => current.length ? current.filter((id) => list.some((o) => o.id === id)) : list.map((o) => o.id));
  }, []);

  const fetchReactions = useCallback(async () => {
    const { data } = await supabase.from("reactions").select("reaction");
    const counts: Record<string, number> = {};
    for (const row of data ?? []) counts[row.reaction] = (counts[row.reaction] ?? 0) + 1;
    setReactionCounts(counts);
  }, []);

  const fetchWords = useCallback(async () => {
    const { data } = await supabase.from("word_cloud_entries").select("word");
    const map: Record<string, number> = {};
    for (const row of data ?? []) {
      const normalized = String(row.word).trim().toLowerCase();
      if (normalized) map[normalized] = (map[normalized] ?? 0) + 1;
    }
    setWords(Object.entries(map).map(([word, count]) => ({ word, count })).sort((a, b) => b.count - a.count).slice(0, 40));
  }, []);

  const fetchQuiz = useCallback(async () => {
    const { data: quiz } = await supabase.from("quizzes").select("*").order("created_at", { ascending: true }).limit(1).single();
    if (!quiz) return;
    setQuizId(quiz.id);
    setQuizQuestion(quiz.question);
    const { data: options } = await supabase.from("quiz_options").select("id,label,is_correct").eq("quiz_id", quiz.id);
    setQuizOptions((options ?? []) as QuizOption[]);
  }, []);

  const fetchRating = useCallback(async () => {
    const { data } = await supabase.from("ratings").select("score");
    const scores = (data ?? []).map((row) => Number(row.score));
    setRatingCount(scores.length);
    setAverageRating(scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0);
  }, []);

  useEffect(() => {
    setParticipantId(getParticipantId());
    fetchQuestions();
    fetchPoll();
    fetchRanking();
    fetchReactions();
    fetchWords();
    fetchQuiz();
    fetchRating();

    const channel = supabase
      .channel("live-qa-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "questions" }, fetchQuestions)
      .on("postgres_changes", { event: "*", schema: "public", table: "polls" }, fetchPoll)
      .on("postgres_changes", { event: "*", schema: "public", table: "ranking_votes" }, fetchRanking)
      .on("postgres_changes", { event: "*", schema: "public", table: "reactions" }, fetchReactions)
      .on("postgres_changes", { event: "*", schema: "public", table: "word_cloud_entries" }, fetchWords)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_responses" }, fetchQuiz)
      .on("postgres_changes", { event: "*", schema: "public", table: "ratings" }, fetchRating)
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchQuestions, fetchPoll, fetchRanking, fetchReactions, fetchWords, fetchQuiz, fetchRating]);

  async function addQuestion() {
    if (!question.trim()) return;
    const { error } = await supabase.from("questions").insert({ text: question.trim(), votes: 0 });
    if (!error) {
      setQuestion("");
      fetchQuestions();
    }
  }

  async function upvote(id: string, votes: number) {
    await supabase.from("questions").update({ votes: votes + 1 }).eq("id", id);
    fetchQuestions();
  }

  async function votePoll(option: number) {
    if (!poll) return;
    const field = `votes${option}`;
    await supabase.from("polls").update({ [field]: Number(poll[field as keyof Poll] ?? 0) + 1 }).eq("id", poll.id);
    fetchPoll();
  }

  async function askAI(id: string, text: string) {
    setLoadingAI(id);
    try {
      const res = await fetch("/api/answer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }) });
      const data = await res.json();
      setAiAnswer((prev) => ({ ...prev, [id]: data.answer }));
    } catch {
      setAiAnswer((prev) => ({ ...prev, [id]: "Error getting AI response." }));
    } finally {
      setLoadingAI(null);
    }
  }

  function moveRanking(index: number, direction: -1 | 1) {
    const next = [...rankingOrder];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setRankingOrder(next);
    setRankingSubmitted(false);
  }

  async function submitRanking() {
    if (!rankingId || !participantId) return;
    const rows = rankingOrder.map((optionId, index) => ({ ranking_id: rankingId, option_id: optionId, participant_id: participantId, rank_position: index + 1 }));
    const { error } = await supabase.from("ranking_votes").upsert(rows, { onConflict: "ranking_id,option_id,participant_id" });
    if (!error) setRankingSubmitted(true);
  }

  async function sendReaction(reaction: string) {
    if (!participantId) return;
    await supabase.from("reactions").insert({ reaction, participant_id: participantId });
    fetchReactions();
  }

  async function submitWord() {
    const clean = word.trim().replace(/\s+/g, " ");
    if (!clean || !participantId) return;
    await supabase.from("word_cloud_entries").insert({ word: clean.slice(0, 30), participant_id: participantId });
    setWord("");
    fetchWords();
  }

  async function submitQuiz(optionId: string) {
    if (!quizId || !participantId) return;
    const selected = quizOptions.find((option) => option.id === optionId);
    const { error } = await supabase.from("quiz_responses").upsert({ quiz_id: quizId, option_id: optionId, participant_id: participantId }, { onConflict: "quiz_id,participant_id" });
    if (!error) {
      setQuizAnswer(optionId);
      setQuizResult(Boolean(selected?.is_correct));
    }
  }

  async function submitRating(score: number) {
    if (!participantId) return;
    const { error } = await supabase.from("ratings").upsert({ score, participant_id: participantId }, { onConflict: "participant_id" });
    if (!error) {
      setRating(score);
      fetchRating();
    }
  }

  const filteredQuestions = questions.filter((q) => q.text.toLowerCase().includes(search.toLowerCase()));
  const totalPollVotes = poll ? poll.votes1 + poll.votes2 + poll.votes3 + poll.votes4 : 0;
  const maxWordCount = words[0]?.count ?? 1;

  const rankingLabels = useMemo(() => rankingOrder.map((id) => rankingOptions.find((option) => option.id === id)).filter(Boolean) as RankingOption[], [rankingOrder, rankingOptions]);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <header className="mb-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-blue-400">Real-time audience engagement</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Live Q&A + AI</h1>
          <p className="mt-2 max-w-2xl text-zinc-400">Ask questions, vote, rank ideas, react, build a word cloud, take quizzes, and rate the session in real time.</p>
        </header>

        <nav className="mb-8 flex gap-2 overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-2">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition ${activeTab === tab.id ? "bg-white text-black" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"}`}>
              {tab.label}
            </button>
          ))}
        </nav>

        {(activeTab === "overview" || activeTab === "ranking") && (
          <section className="mb-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="mb-4 text-2xl font-semibold">Ask a Question</h2>
              <div className="flex gap-3">
                <input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addQuestion()} placeholder="Ask a question..." className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-blue-500" />
                <button onClick={addQuestion} className="rounded-xl bg-blue-600 px-5 py-3 font-medium hover:bg-blue-500">Ask</button>
              </div>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions..." className="mt-3 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-blue-500" />
            </div>

            {poll && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <h2 className="mb-4 text-2xl font-semibold">Poll</h2>
                <p className="mb-4 text-zinc-300">{poll.question}</p>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((num) => {
                    const text = poll[`option${num}` as keyof Poll] as string | undefined;
                    if (!text) return null;
                    const votes = Number(poll[`votes${num}` as keyof Poll] ?? 0);
                    const percentage = totalPollVotes ? (votes / totalPollVotes) * 100 : 0;
                    return <button key={num} onClick={() => votePoll(num)} className="relative w-full overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 text-left"><span className="absolute inset-y-0 left-0 bg-blue-500/30" style={{ width: `${percentage}%` }} /><span className="relative flex justify-between p-4"><span>{text}</span><span>{Math.round(percentage)}%</span></span></button>;
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {(activeTab === "overview" || activeTab === "ranking") && rankingId && (
          <section className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div><p className="text-sm uppercase tracking-wider text-zinc-500">New interaction</p><h2 className="text-2xl font-semibold">{rankingTitle}</h2></div>
              <button onClick={submitRanking} className="rounded-xl bg-blue-600 px-5 py-3 font-medium hover:bg-blue-500">{rankingSubmitted ? "Ranking Submitted" : "Submit Ranking"}</button>
            </div>
            <div className="space-y-3">
              {rankingLabels.map((option, index) => <div key={option.id} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 font-bold">{index + 1}</span><span className="flex-1">{option.label}</span><button onClick={() => moveRanking(index, -1)} disabled={index === 0} className="rounded-lg border border-zinc-700 px-3 py-2 text-zinc-300 disabled:opacity-30">↑</button><button onClick={() => moveRanking(index, 1)} disabled={index === rankingLabels.length - 1} className="rounded-lg border border-zinc-700 px-3 py-2 text-zinc-300 disabled:opacity-30">↓</button></div>)}
            </div>
          </section>
        )}

        {(activeTab === "overview" || activeTab === "reactions") && (
          <section className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-2xl font-semibold">Emoji Reactions</h2><p className="mb-5 mt-1 text-zinc-400">Send a reaction and watch the totals update live.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {reactionOptions.map((reaction) => <button key={reaction.key} onClick={() => sendReaction(reaction.key)} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-center transition hover:border-zinc-600 hover:bg-zinc-800"><div className="text-4xl">{reaction.symbol}</div><div className="mt-2 text-sm text-zinc-400">{reaction.label}</div><div className="mt-1 text-2xl font-bold">{reactionCounts[reaction.key] ?? 0}</div></button>)}
            </div>
          </section>
        )}

        {(activeTab === "overview" || activeTab === "wordcloud") && (
          <section className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-5"><h2 className="text-2xl font-semibold">Word Cloud</h2><p className="text-zinc-400">Submit a word or short phrase. Popular responses appear larger.</p></div>
            <div className="mb-6 flex gap-3"><input value={word} onChange={(e) => setWord(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitWord()} maxLength={30} placeholder="One word or short phrase..." className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-blue-500" /><button onClick={submitWord} className="rounded-xl bg-blue-600 px-5 py-3 font-medium">Submit</button></div>
            <div className="flex min-h-40 flex-wrap items-center justify-center gap-x-6 gap-y-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-8">{words.length ? words.map((item) => <span key={item.word} title={`${item.count} response${item.count === 1 ? "" : "s"}`} style={{ fontSize: `${Math.max(1, Math.min(3, 0.9 + (item.count / maxWordCount) * 2))}rem` }} className="font-bold text-zinc-200">{item.word}</span>) : <span className="text-zinc-500">No responses yet.</span>}</div>
          </section>
        )}

        {(activeTab === "overview" || activeTab === "quiz") && quizId && (
          <section className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm uppercase tracking-wider text-zinc-500">Quiz Mode</p><h2 className="mb-5 mt-1 text-2xl font-semibold">{quizQuestion}</h2>
            <div className="grid gap-3 sm:grid-cols-2">{quizOptions.map((option, index) => <button key={option.id} onClick={() => submitQuiz(option.id)} className={`rounded-xl border p-4 text-left transition ${quizAnswer === option.id ? option.is_correct ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10" : "border-zinc-700 bg-zinc-950 hover:border-zinc-500"}`}><span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-sm">{String.fromCharCode(65 + index)}</span>{option.label}</button>)}</div>
            {quizResult !== null && <p className={`mt-4 font-medium ${quizResult ? "text-green-400" : "text-red-400"}`}>{quizResult ? "Correct answer." : "Incorrect answer."}</p>}
          </section>
        )}

        {(activeTab === "overview" || activeTab === "rating") && (
          <section className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
            <p className="text-sm uppercase tracking-wider text-zinc-500">Live Rating</p><h2 className="mt-1 text-2xl font-semibold">How would you rate this session?</h2>
            <div className="my-6 flex justify-center gap-2">{[1, 2, 3, 4, 5].map((score) => <button key={score} onClick={() => submitRating(score)} aria-label={`Rate ${score} out of 5`} className={`text-4xl transition ${score <= rating ? "text-yellow-400" : "text-zinc-700 hover:text-yellow-300"}`}>★</button>)}</div>
            <p className="text-zinc-400">Average <span className="font-semibold text-white">{averageRating.toFixed(1)}/5</span> from {ratingCount} rating{ratingCount === 1 ? "" : "s"}</p>
          </section>
        )}

        {(activeTab === "overview") && (
          <section>
            <div className="mb-4 flex items-center justify-between"><h2 className="text-2xl font-semibold">Questions</h2><span className="text-sm text-zinc-500">{filteredQuestions.length} question{filteredQuestions.length === 1 ? "" : "s"}</span></div>
            <div className="space-y-4">
              {filteredQuestions.length === 0 && <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500">No questions found.</div>}
              {filteredQuestions.map((q) => <div key={q.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><div className="flex gap-4"><button onClick={() => upvote(q.id, q.votes)} className="flex h-16 min-w-16 flex-col items-center justify-center rounded-xl bg-zinc-800 text-sm hover:bg-zinc-700"><span>▲</span><span>{q.votes}</span></button><div className="min-w-0 flex-1"><p className="text-lg">{q.text}</p><button onClick={() => askAI(q.id, q.text)} className="mt-3 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-500">Ask AI</button>{loadingAI === q.id && <p className="mt-2 text-sm text-zinc-500">AI thinking...</p>}{aiAnswer[q.id] && <div className="mt-3 rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-green-300">{aiAnswer[q.id]}</div>}</div></div></div>)}
            </div>
          </section>
        )}

        <footer className="mt-12 border-t border-zinc-900 pt-6 text-sm text-zinc-600">Live-QA • Next.js • Supabase • Groq AI</footer>
      </div>
    </main>
  );
}
