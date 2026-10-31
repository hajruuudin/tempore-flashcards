"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Layers,
  CheckCircle2,
  Calendar,
  ArrowLeft,
  Play,
} from "lucide-react";
import { api } from "@/lib/api";
import { OverallStats } from "@/types";

export default function StatsPage() {
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");

  useEffect(() => {
    api.getOverallStats().then((data) => {
      setStats(data);
      if (data.deckBreakdown.length > 0) {
        setSelectedDeckId(data.deckBreakdown[0].id);
      }
    });
  }, []);

  const selectedDeck = useMemo(
    () => stats?.deckBreakdown.find((d) => d.id === selectedDeckId) || null,
    [stats, selectedDeckId]
  );

  const deckTotalRated =
    (selectedDeck?.easyCount || 0) +
    (selectedDeck?.normalCount || 0) +
    (selectedDeck?.hardCount || 0);

  const deckEasyPct =
    deckTotalRated > 0
      ? Math.round(((selectedDeck?.easyCount || 0) / deckTotalRated) * 100)
      : 0;
  const deckNormalPct =
    deckTotalRated > 0
      ? Math.round(((selectedDeck?.normalCount || 0) / deckTotalRated) * 100)
      : 0;
  const deckHardPct =
    deckTotalRated > 0 ? Math.max(0, 100 - deckEasyPct - deckNormalPct) : 0;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-semibold text-silver-500 hover:text-wine-plum-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Homescreen</span>
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-silver-900">
          Statistical Overview
        </h1>
        <p className="text-xs text-silver-600">
          Overall study metrics across your workspace followed by deep-dive
          analytics for each individual deck.
        </p>
      </div>

      {/* =====================================================================
          1. OVERALL WORKSPACE STATISTICS
      ===================================================================== */}
      <section className="rounded-2xl border border-bone-200 bg-white/85 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-wine-plum-700" />
          <h2 className="text-lg font-bold text-silver-900">
            Overall Performance
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-bone-200 bg-bone-50/70 p-4">
            <span className="text-xs font-medium text-silver-500">
              Total Cards
            </span>
            <p className="mt-1 text-2xl font-bold text-silver-900">
              {stats?.totalCards ?? 0}
            </p>
            <span className="text-[11px] font-semibold text-wine-plum-600">
              +{stats?.cardsAddedToday ?? 0} added today
            </span>
          </div>

          <div className="rounded-xl border border-bone-200 bg-bone-50/70 p-4">
            <span className="text-xs font-medium text-silver-500">
              Total Reviews
            </span>
            <p className="mt-1 text-2xl font-bold text-silver-900">
              {stats?.totalReviews ?? 0}
            </p>
            <span className="text-[11px] font-semibold text-almond-silk-600">
              {stats?.reviewsToday ?? 0} completed today
            </span>
          </div>

          <div className="rounded-xl border border-bone-200 bg-bone-50/70 p-4">
            <span className="text-xs font-medium text-silver-500">
              Exact-Match Accuracy
            </span>
            <p className="mt-1 text-2xl font-bold text-silver-900">
              {stats?.exactMatchAccuracy ?? 0}%
            </p>
            <span className="text-[11px] font-semibold text-smoky-rose-600">
              Written verification
            </span>
          </div>

          <div className="rounded-xl border border-bone-200 bg-bone-50/70 p-4">
            <span className="text-xs font-medium text-silver-500">
              Active Decks
            </span>
            <p className="mt-1 text-2xl font-bold text-silver-900">
              {stats?.totalDecks ?? 0}
            </p>
            <span className="text-[11px] font-semibold text-silver-500">
              In {stats?.totalFolders ?? 0} folders
            </span>
          </div>
        </div>

        {/* 7-Day Activity Chart */}
        <div className="rounded-xl border border-bone-200 bg-bone-50/40 p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-silver-700">
              7-Day Study &amp; Card Creation Activity
            </h3>
            <div className="flex items-center gap-4 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1.5 text-wine-plum-700">
                <span className="h-2.5 w-2.5 rounded-sm bg-wine-plum-600" />
                Reviews Completed
              </span>
              <span className="inline-flex items-center gap-1.5 text-bone-700">
                <span className="h-2.5 w-2.5 rounded-sm bg-bone-400" />
                Cards Added
              </span>
            </div>
          </div>

          <div className="mt-6 flex h-36 items-end justify-between gap-3 pt-4">
            {(stats?.last7DaysActivity || []).map((day) => {
              const max = Math.max(
                1,
                ...(stats?.last7DaysActivity.map((d) =>
                  Math.max(d.reviewsCount, d.cardsAddedCount)
                ) || [1])
              );
              const revH = Math.max(
                10,
                Math.round((day.reviewsCount / max) * 100)
              );
              const addH = Math.max(
                10,
                Math.round((day.cardsAddedCount / max) * 100)
              );

              return (
                <div
                  key={day.date}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <div className="flex w-full items-end justify-center gap-1.5 h-28">
                    <div
                      style={{ height: `${revH}px` }}
                      className="w-3 sm:w-4 rounded-t-md bg-wine-plum-600 transition-all"
                      title={`${day.reviewsCount} reviews`}
                    />
                    <div
                      style={{ height: `${addH}px` }}
                      className="w-3 sm:w-4 rounded-t-md bg-bone-400 transition-all"
                      title={`${day.cardsAddedCount} added`}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-silver-600">
                    {day.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. INDIVIDUAL DECK STATISTICS OF CHOICE
      ===================================================================== */}
      <section className="rounded-2xl border border-bone-200 bg-white/85 p-6 shadow-sm space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-almond-silk-600" />
            <div>
              <h2 className="text-lg font-bold text-silver-900">
                Individual Deck Statistics
              </h2>
              <p className="text-xs text-silver-500">
                Select any deck to inspect its mastery, daily additions, and
                difficulty breakdown.
              </p>
            </div>
          </div>

          <select
            value={selectedDeckId}
            onChange={(e) => setSelectedDeckId(e.target.value)}
            className="rounded-xl border border-bone-300 bg-bone-50 px-3.5 py-2 text-xs font-bold text-silver-900 focus:border-wine-plum-600 focus:outline-none"
          >
            {(stats?.deckBreakdown || []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.totalCards} cards)
              </option>
            ))}
          </select>
        </div>

        {selectedDeck ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-bone-200 bg-bone-50/60 p-4">
                <span className="text-xs font-medium text-silver-500">
                  Deck Cards
                </span>
                <p className="mt-1 text-xl font-bold text-silver-900">
                  {selectedDeck.totalCards}
                </p>
                <span className="text-[11px] text-silver-500">
                  {selectedDeck.folderName || "Uncategorized"}
                </span>
              </div>

              <div className="rounded-xl border border-bone-200 bg-bone-50/60 p-4">
                <span className="text-xs font-medium text-silver-500">
                  Added Today
                </span>
                <p className="mt-1 text-xl font-bold text-wine-plum-700">
                  +{selectedDeck.cardsAddedToday}
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] text-silver-500">
                  <Calendar className="h-3 w-3" /> Today
                </span>
              </div>

              <div className="rounded-xl border border-bone-200 bg-bone-50/60 p-4">
                <span className="text-xs font-medium text-silver-500">
                  Deck Mastery
                </span>
                <p className="mt-1 text-xl font-bold text-almond-silk-700">
                  {selectedDeck.masteryPercentage}%
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] text-almond-silk-700">
                  <CheckCircle2 className="h-3 w-3" /> Easy dominance
                </span>
              </div>

              <div className="rounded-xl border border-bone-200 bg-bone-50/60 p-4">
                <span className="text-xs font-medium text-silver-500">
                  Total Deck Reviews
                </span>
                <p className="mt-1 text-xl font-bold text-silver-900">
                  {selectedDeck.totalReviews}
                </p>
                <span className="text-[11px] text-silver-500">
                  All-time sessions
                </span>
              </div>
            </div>

            {/* Selected Deck Difficulty Bar */}
            <div className="rounded-xl border border-bone-200 bg-bone-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-silver-700">
                <span>{selectedDeck.name} — Difficulty Breakdown</span>
                <span>
                  {selectedDeck.easyCount} Easy • {selectedDeck.normalCount}{" "}
                  Normal • {selectedDeck.hardCount} Hard
                </span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-bone-200 flex">
                <div
                  style={{ width: `${deckEasyPct}%` }}
                  className="bg-bone-500 transition-all"
                />
                <div
                  style={{ width: `${deckNormalPct}%` }}
                  className="bg-almond-silk-500 transition-all"
                />
                <div
                  style={{ width: `${deckHardPct}%` }}
                  className="bg-wine-plum-700 transition-all"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Link
                  href={`/decks/${selectedDeck.id}`}
                  className="rounded-lg border border-bone-300 bg-white px-3 py-1.5 text-xs font-semibold text-silver-800 hover:bg-bone-100"
                >
                  Inspect Cards
                </Link>
                <Link
                  href={`/review?deckId=${selectedDeck.id}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-wine-plum-700 px-3 py-1.5 text-xs font-semibold text-bone-50 hover:bg-wine-plum-800"
                >
                  <Play className="h-3 w-3" />
                  <span>Review Deck</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-silver-500">No deck selected.</p>
        )}
      </section>
    </div>
  );
}
