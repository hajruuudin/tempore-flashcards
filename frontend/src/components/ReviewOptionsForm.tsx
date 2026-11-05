"use client";

import { DeckSummary } from "@/types";
import { ReviewOptions } from "@/lib/review";

interface ReviewOptionsFormProps {
  options: ReviewOptions;
  decks: DeckSummary[];
  onChange: (next: ReviewOptions) => void;
  // Tailwind grid classes for the option tiles
  gridClassName?: string;
}

const tileBase =
  "flex flex-col items-center justify-center rounded-xl px-3 py-3 text-center text-tf-text transition";
const selectClass =
  "w-full cursor-pointer bg-transparent text-center text-sm font-bold text-white focus:outline-none [&>option]:bg-tf-panel";

export default function ReviewOptionsForm({
  options,
  decks,
  onChange,
  gridClassName = "grid-cols-1 sm:grid-cols-3",
}: ReviewOptionsFormProps) {
  const set = <K extends keyof ReviewOptions>(key: K, value: ReviewOptions[K]) =>
    onChange({ ...options, [key]: value });

  return (
    <div className="space-y-4">
      <select
        aria-label="Select deck"
        value={options.deckId}
        onChange={(e) => set("deckId", e.target.value)}
        className="tf-input cursor-pointer [&>option]:bg-tf-panel"
      >
        {decks.length === 0 && <option value="">No decks available</option>}
        {decks.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name} ({d.totalCards} cards)
          </option>
        ))}
      </select>

      <div className={`grid gap-3 ${gridClassName}`}>
        <label className={`${tileBase} bg-tf-tile`}>
          <span className="text-xs text-tf-muted">Total Cards</span>
          <select
            value={options.limit}
            onChange={(e) => set("limit", Number(e.target.value))}
            className={selectClass}
          >
            <option value={5}>5 cards</option>
            <option value={10}>10 cards</option>
            <option value={20}>20 cards</option>
            <option value={50}>50 cards</option>
            <option value={0}>All cards</option>
          </select>
        </label>

        <label className={`${tileBase} bg-tf-tile`}>
          <span className="text-xs text-tf-muted">Order</span>
          <select
            value={options.order}
            onChange={(e) => set("order", e.target.value)}
            className={selectClass}
          >
            <option value="random">Random</option>
            <option value="hardest">Hardest first</option>
            <option value="oldest">Oldest first</option>
            <option value="newest">Newest first</option>
          </select>
        </label>

        <label className={`${tileBase} bg-tf-tile`}>
          <span className="text-xs text-tf-muted">First page</span>
          <select
            value={options.firstSide}
            onChange={(e) => set("firstSide", e.target.value as "front" | "back")}
            className={selectClass}
          >
            <option value="front">Front</option>
            <option value="back">Back</option>
          </select>
        </label>

        <button
          type="button"
          aria-pressed={options.weakOnly}
          onClick={() => set("weakOnly", !options.weakOnly)}
          className={`${tileBase} ${
            options.weakOnly
              ? "bg-tf-accent"
              : "bg-tf-tile hover:bg-tf-tile-hover"
          }`}
        >
          <span className="text-xs text-tf-muted">Only weak cards</span>
          <span className="text-sm font-bold text-white">
            {options.weakOnly ? "On" : "Off"}
          </span>
        </button>

        <button
          type="button"
          aria-pressed={options.todayOnly}
          onClick={() => set("todayOnly", !options.todayOnly)}
          className={`${tileBase} ${
            options.todayOnly
              ? "bg-tf-accent"
              : "bg-tf-tile hover:bg-tf-tile-hover"
          }`}
        >
          <span className="text-xs text-tf-muted">Only today&apos;s cards</span>
          <span className="text-sm font-bold text-white">
            {options.todayOnly ? "On" : "Off"}
          </span>
        </button>

        <label className={`${tileBase} bg-tf-tile`}>
          <span className="text-xs text-tf-muted">Type</span>
          <select
            value={options.mode}
            onChange={(e) =>
              set("mode", e.target.value as ReviewOptions["mode"])
            }
            className={selectClass}
          >
            <option value="Standard">Flip</option>
            <option value="ExactMatch">Write</option>
          </select>
        </label>
      </div>
    </div>
  );
}
