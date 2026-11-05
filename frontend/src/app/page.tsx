"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import NewDeckModal from "@/components/NewDeckModal";
import QuickAddCardModal from "@/components/QuickAddCardModal";
import StartReviewModal from "@/components/StartReviewModal";
import { AnswerBars, LineChart } from "@/components/Charts";
import { api } from "@/lib/api";
import { correctnessPercent } from "@/lib/review";
import { DeckSummary, OverallStats } from "@/types";

type ActiveModal = "quickAdd" | "review" | "newDeck" | null;

const MAX_HOME_DECKS = 6;

export default function HomePage() {
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [modal, setModal] = useState<ActiveModal>(null);

  const loadData = useCallback(async () => {
    const [overall, deckList] = await Promise.all([
      api.getOverallStats(),
      api.getDecks(),
    ]);
    setStats(overall);
    setDecks(deckList);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const closeModal = useCallback(() => setModal(null), []);

  const week = stats?.last7DaysActivity ?? [];
  const weekSummary = useMemo(() => {
    const hasBreakdown = week.some(
      (d) => d.easyCount !== undefined || d.hardCount !== undefined
    );
    const sum = (pick: (d: (typeof week)[number]) => number) =>
      week.reduce((acc, d) => acc + pick(d), 0);
    const easy = hasBreakdown ? sum((d) => d.easyCount ?? 0) : stats?.easyTotal ?? 0;
    const normal = hasBreakdown
      ? sum((d) => d.normalCount ?? 0)
      : stats?.normalTotal ?? 0;
    const hard = hasBreakdown ? sum((d) => d.hardCount ?? 0) : stats?.hardTotal ?? 0;
    return {
      reviewed: sum((d) => d.reviewsCount),
      added: sum((d) => d.cardsAddedCount),
      correctness: correctnessPercent(easy, normal, hard),
    };
  }, [week, stats]);

  // Most recently reviewed first, then most practiced
  const recentDecks = useMemo(() => {
    return [...decks]
      .sort((a, b) => {
        const aTime = a.lastReviewedAt ? new Date(a.lastReviewedAt).getTime() : 0;
        const bTime = b.lastReviewedAt ? new Date(b.lastReviewedAt).getTime() : 0;
        if (bTime !== aTime) return bTime - aTime;
        if (b.totalReviews !== a.totalReviews) return b.totalReviews - a.totalReviews;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, MAX_HOME_DECKS);
  }, [decks]);

  const defaultDeckId = recentDecks[0]?.id;

  const quickActions: {
    key: Exclude<ActiveModal, null>;
    title: string;
    text: string;
  }[] = [
    {
      key: "quickAdd",
      title: "Quick Add cards",
      text: "Add new flashcards to any deck from a dedicated window.",
    },
    {
      key: "review",
      title: "Start Review",
      text: "Start a review from scratch. Setup the review settings to your liking.",
    },
    {
      key: "newDeck",
      title: "New Deck",
      text: "Create a new deck and add it to a folder. Add flashcards by hand or import from a CSV file.",
    },
  ];

  const statTiles = [
    { value: weekSummary.reviewed, label: "Total Cards Reviewed" },
    { value: stats?.reviewsToday ?? 0, label: "Reviewed Today" },
    { value: `${weekSummary.correctness}%`, label: "Correctness Percentage" },
    { value: weekSummary.added, label: "New Cards Added" },
  ];

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Homepage"
        title="Welcome Back! Add new cards, review & more."
      />

      <section className="tf-panel">
        <span className="tf-eyebrow">Quick Actions</span>
        <h2 className="text-xl font-semibold text-white sm:text-2xl">
          Add cards, start a new review or add a new deck
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
          {quickActions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => setModal(action.key)}
              className="tf-tile flex min-h-[190px] flex-col items-center justify-center gap-1.5 px-6 py-6 text-center transition hover:-translate-y-0.5 hover:bg-tf-tile-hover"
            >
              <span className="text-xl font-bold text-white">{action.title}</span>
              <span className="text-sm leading-snug text-tf-text">
                {action.text}
              </span>
            </button>
          ))}
        </div>
      </section>

      <hr className="tf-divider" />

      <section className="tf-panel">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="tf-eyebrow">Performance Overview</span>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Your recent performance over the past period
            </h2>
          </div>
          <span className="tf-btn-small shrink-0 cursor-default hover:bg-tf-tile">
            Past Week
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statTiles.map((tile) => (
            <div
              key={tile.label}
              className="tf-tile flex flex-col items-center justify-center px-3 py-4 text-center"
            >
              <span className="text-3xl font-bold text-white">{tile.value}</span>
              <span className="text-sm font-light">{tile.label}</span>
            </div>
          ))}
        </div>

        <div className="tf-tile mt-6 p-5 sm:p-6">
          <h3 className="text-center text-sm font-bold text-white">
            Past Week Activity
          </h3>
          <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-0">
            <div className="flex flex-col justify-between lg:border-r lg:border-tf-peach/80 lg:pr-6">
              <AnswerBars days={week} />
              <p className="mt-4 text-center text-sm font-bold text-white">
                Review answers
              </p>
            </div>
            <div className="flex flex-col justify-between lg:pl-6">
              <div className="flex flex-1 items-center">
                <div className="w-full">
                  <LineChart days={week} />
                </div>
              </div>
              <p className="mt-4 text-center text-sm font-bold text-white">
                Total cards reviewed
              </p>
            </div>
          </div>
        </div>
      </section>

      <hr className="tf-divider" />

      <section className="tf-panel">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="tf-eyebrow">Decks</span>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              View your most recent &amp; most practiced decks
            </h2>
          </div>
          <span className="tf-btn-small shrink-0 cursor-default hover:bg-tf-tile">
            {decks.length} {decks.length === 1 ? "deck" : "decks"}
          </span>
        </div>

        {recentDecks.length === 0 ? (
          <div className="mt-8 rounded-xl bg-tf-row p-8 text-center">
            <p className="text-sm font-semibold text-tf-muted">
              No decks yet. Create your first deck to get started!
            </p>
            <button
              type="button"
              onClick={() => setModal("newDeck")}
              className="tf-btn-primary mt-4"
            >
              New Deck
            </button>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {recentDecks.map((deck) => (
              <li
                key={deck.id}
                className="flex flex-col gap-3 rounded-xl bg-tf-row px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <Link
                  href={`/decks/${deck.id}`}
                  className="min-w-0 truncate text-lg font-semibold text-white hover:text-tf-sky"
                >
                  {deck.name}
                </Link>
                <div className="flex shrink-0 gap-2">
                  <Link
                    href={`/add-card?deckId=${deck.id}`}
                    className="tf-btn-small w-28 justify-center"
                  >
                    Add Cards
                  </Link>
                  <Link
                    href={`/review?deckId=${deck.id}&start=1`}
                    className="tf-btn-small w-28 justify-center"
                  >
                    Review now
                  </Link>
                  <Link
                    href={`/decks/${deck.id}`}
                    className="tf-btn-small w-28 justify-center"
                  >
                    Edit
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {modal === "quickAdd" && (
        <QuickAddCardModal
          decks={decks}
          defaultDeckId={defaultDeckId}
          onClose={closeModal}
          onAdded={loadData}
        />
      )}
      {modal === "review" && (
        <StartReviewModal
          decks={decks}
          defaultDeckId={defaultDeckId}
          onClose={closeModal}
        />
      )}
      {modal === "newDeck" && (
        <NewDeckModal onClose={closeModal} onCreated={loadData} />
      )}
    </div>
  );
}
