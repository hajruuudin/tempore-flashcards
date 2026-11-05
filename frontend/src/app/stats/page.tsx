"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { AnswerBars, LineChart, MonthBars } from "@/components/Charts";
import { api } from "@/lib/api";
import { correctnessPercent } from "@/lib/review";
import { OverallStats } from "@/types";

type SortKey = "name" | "cards" | "reviewed" | "performance";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "performance", label: "Performance" },
  { value: "reviewed", label: "Times reviewed" },
  { value: "cards", label: "Cards" },
  { value: "name", label: "Name" },
];

export default function StatsPage() {
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("performance");

  useEffect(() => {
    api.getOverallStats().then(setStats);
  }, []);

  const days = stats?.last7DaysActivity ?? [];
  const months = stats?.last6MonthsActivity ?? [];

  const decks = useMemo(() => {
    const rows = (stats?.deckBreakdown ?? []).map((d) => ({
      ...d,
      performance: correctnessPercent(d.easyCount, d.normalCount, d.hardCount),
    }));
    return rows.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "cards":
          return b.totalCards - a.totalCards;
        case "reviewed":
          return b.totalReviews - a.totalReviews;
        default:
          return b.performance - a.performance;
      }
    });
  }, [stats, sortBy]);

  const overallTiles = [
    { value: stats?.totalReviews ?? 0, label: "Total Cards Reviewed", className: "bg-tf-accent" },
    { value: stats?.reviewsToday ?? 0, label: "Reviewed Today", className: "bg-[#27798a]" },
    {
      value: `${correctnessPercent(
        stats?.easyTotal ?? 0,
        stats?.normalTotal ?? 0,
        stats?.hardTotal ?? 0
      )}%`,
      label: "Correctness Percentage",
      className: "bg-[#21626f]",
    },
    { value: stats?.totalCards ?? 0, label: "Total Cards", className: "bg-tf-ink" },
  ];

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Stats"
        title="Statistical overview of all decks & cards over the past period."
      />

      <section className="rounded-2xl bg-tf-tile p-5 sm:p-8">
        <h2 className="text-center text-lg font-bold text-white">
          All time Performance
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {overallTiles.map((tile) => (
            <div
              key={tile.label}
              className={`flex flex-col items-center justify-center rounded-xl px-3 py-4 text-center ${tile.className}`}
            >
              <span className="text-3xl font-bold text-white">{tile.value}</span>
              <span className="text-sm font-light">{tile.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <span className="tf-eyebrow">Cards Studied</span>
        <h2 className="text-xl font-semibold text-white sm:text-2xl">
          Total cards studied over the last 7 days
        </h2>
        <div className="mt-6">
          <LineChart days={days} tall yLabel="NUMBER OF CARDS" />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="tf-panel">
          <span className="tf-eyebrow">Card Answers</span>
          <h2 className="text-lg font-semibold text-white sm:text-xl">
            Card answer data over the last 7 days
          </h2>
          <div className="mt-8">
            <AnswerBars days={days} showLegend />
          </div>
        </section>

        <section className="tf-panel">
          <span className="tf-eyebrow">Card Numbers</span>
          <h2 className="text-lg font-semibold text-white sm:text-xl">
            Cards added &amp; reviewed in the last 6 months
          </h2>
          <div className="mt-8">
            <MonthBars months={months} />
          </div>
        </section>
      </div>

      <section>
        <div className="flex items-end justify-between gap-3">
          <div>
            <span className="tf-eyebrow">Per Deck Performance</span>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Performance for each individual deck
            </h2>
          </div>
          <label className="relative shrink-0">
            <span className="sr-only">Sort decks by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="cursor-pointer rounded-lg bg-tf-tile px-4 py-1.5 text-xs font-bold text-white focus:outline-none [&>option]:bg-tf-panel"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  Sort By: {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {decks.length === 0 ? (
          <p className="mt-6 rounded-xl bg-tf-panel p-8 text-center text-sm font-semibold text-tf-muted">
            No decks yet — create one from the homepage.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {decks.map((deck) => (
              <li
                key={deck.id}
                className="flex flex-col gap-2 overflow-hidden rounded-xl bg-tf-panel pl-5 sm:flex-row sm:items-center"
              >
                <Link
                  href={`/decks/${deck.id}`}
                  className="min-w-0 flex-1 truncate py-3 text-lg font-semibold text-white hover:text-tf-sky"
                >
                  {deck.name}
                </Link>
                <div className="flex flex-wrap items-center gap-x-8 gap-y-1 text-sm text-white sm:py-3">
                  <span>
                    <b>Cards:</b> {deck.totalCards}
                  </span>
                  <span>
                    <b>Reviewed:</b> {deck.totalReviews} times
                  </span>
                  <span>
                    <b>Performance:</b> {deck.performance}%
                  </span>
                </div>
                <Link
                  href={`/review?deckId=${deck.id}&start=1`}
                  className="flex items-center justify-center self-stretch bg-tf-tile px-8 py-3 text-sm font-bold text-white transition hover:bg-tf-tile-hover sm:ml-4"
                >
                  Review
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
