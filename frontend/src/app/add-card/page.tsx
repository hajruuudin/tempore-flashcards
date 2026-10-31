"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  PlusCircle,
  Search,
  Calendar,
  Tag,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Layers,
} from "lucide-react";
import { api } from "@/lib/api";
import { DeckSummary, Flashcard } from "@/types";

function AddCardContent() {
  const searchParams = useSearchParams();
  const initialDeckId = searchParams.get("deckId") || "";

  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>(initialDeckId);
  const [deckCards, setDeckCards] = useState<Flashcard[]>([]);

  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadDecks = async () => {
    const list = await api.getDecks();
    setDecks(list);
    const activeId = initialDeckId || list[0]?.id || "";
    if (!selectedDeckId && activeId) {
      setSelectedDeckId(activeId);
    }
  };

  const loadDeckCards = async (deckId: string) => {
    if (!deckId) return;
    const cards = await api.getCards({ deckId });
    setDeckCards(cards);
  };

  useEffect(() => {
    loadDecks();
  }, []);

  useEffect(() => {
    if (selectedDeckId) {
      loadDeckCards(selectedDeckId);
    }
  }, [selectedDeckId]);

  const currentDeck = useMemo(
    () => decks.find((d) => d.id === selectedDeckId),
    [decks, selectedDeckId]
  );

  // Calculate how many cards were added to this deck today
  const addedTodayCount = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return deckCards.filter((c) => c.createdAt.slice(0, 10) === todayStr)
      .length;
  }, [deckCards]);

  // Live duplicate / existing card search: checks both explicit search query AND current Front input
  const matchingExistingCards = useMemo(() => {
    const effectiveQuery = (searchQuery.trim() || front.trim()).toLowerCase();
    if (!effectiveQuery) return deckCards.slice(0, 8);
    return deckCards.filter(
      (c) =>
        c.front.toLowerCase().includes(effectiveQuery) ||
        c.back.toLowerCase().includes(effectiveQuery) ||
        c.tags.some((t) => t.toLowerCase().includes(effectiveQuery))
    );
  }, [deckCards, searchQuery, front]);

  const exactDuplicateExists = useMemo(() => {
    if (!front.trim()) return false;
    return deckCards.some(
      (c) => c.front.trim().toLowerCase() === front.trim().toLowerCase()
    );
  }, [deckCards, front]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeckId || !front.trim() || !back.trim()) return;

    const tags = tagsInput
      .split(/[;,]/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    await api.createCard({
      deckId: selectedDeckId,
      front,
      back,
      tags,
    });

    setFront("");
    setBack("");
    setTagsInput("");
    setStatusMessage("Flashcard added to deck!");
    setTimeout(() => setStatusMessage(null), 3000);

    await Promise.all([loadDeckCards(selectedDeckId), loadDecks()]);
  };

  return (
    <div className="space-y-6">
      {/* Header & Deck Today Stats Overview */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-silver-500 hover:text-wine-plum-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Homescreen</span>
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-silver-900">
            Add Flashcards
          </h1>
          <p className="text-xs text-silver-600">
            Create front &amp; back cards while checking existing cards in real
            time to prevent duplicates.
          </p>
        </div>

        {/* Stats Badge: How many cards were added to this deck today */}
        <div className="flex items-center gap-3 rounded-2xl border border-wine-plum-200 bg-wine-plum-50/70 px-4 py-3">
          <div className="rounded-xl bg-wine-plum-700 p-2 text-bone-50">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-wine-plum-700">
              Added to Deck Today
            </span>
            <span className="text-lg font-bold text-wine-plum-900">
              {addedTodayCount} {addedTodayCount === 1 ? "card" : "cards"}{" "}
              <span className="text-xs font-normal text-wine-plum-700">
                ({deckCards.length} total in {currentDeck?.name || "deck"})
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Add Card Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-bone-200 bg-white/85 p-6 shadow-sm space-y-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-silver-700">
              Target Deck
            </label>
            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-bone-300 bg-bone-50 px-3.5 py-2.5 text-sm font-semibold text-silver-900 focus:border-wine-plum-600 focus:outline-none"
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.totalCards} cards)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-silver-700">
              Tags (comma or semicolon separated)
            </label>
            <div className="relative mt-1.5">
              <Tag className=" absolute left-3 top-3 h-4 w-4 text-silver-400" />
              <input
                type="text"
                placeholder="e.g. csharp, async, exam-prep"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full rounded-xl border border-bone-300 bg-white pl-9 pr-3.5 py-2 text-sm text-silver-900 focus:border-wine-plum-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Front Input with Live Duplicate Warning */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-silver-700">
              Front (Prompt / Question)
            </label>
            {exactDuplicateExists && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-smoky-rose-700">
                <AlertCircle className="h-3.5 w-3.5" />
                Identical front already exists in this deck!
              </span>
            )}
          </div>
          <textarea
            rows={2}
            required
            placeholder="Type the question or prompt... (automatically searches existing cards below)"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-bone-300 bg-white p-3.5 text-sm text-silver-900 focus:border-wine-plum-600 focus:outline-none"
          />
        </div>

        {/* Back Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-silver-700">
            Back (Exact Answer)
          </label>
          <textarea
            rows={3}
            required
            placeholder="Type the answer (used for both standard flip and exact-match typing review)..."
            value={back}
            onChange={(e) => setBack(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-bone-300 bg-white p-3.5 text-sm text-silver-900 focus:border-wine-plum-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            {statusMessage && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-wine-plum-700">
                <CheckCircle2 className="h-4 w-4" />
                {statusMessage}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedDeckId && (
              <Link
                href={`/decks/${selectedDeckId}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-bone-300 bg-bone-50 px-3.5 py-2.5 text-xs font-semibold text-silver-700 hover:bg-bone-100"
              >
                <Layers className="h-4 w-4" />
                <span>View All Deck Cards</span>
              </Link>
            )}
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-wine-plum-700 px-5 py-2.5 text-xs font-semibold text-bone-50 shadow-sm transition hover:bg-wine-plum-800"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add Flashcard</span>
            </button>
          </div>
        </div>
      </form>

      {/* Search & Existing Cards in Deck Section (with Date Added) */}
      <section className="rounded-2xl border border-bone-200 bg-white/80 p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-almond-silk-600">
              Duplicate Check &amp; History
            </span>
            <h2 className="text-base font-bold text-silver-900">
              Search Existing Cards in{" "}
              <span className="text-wine-plum-700">
                {currentDeck?.name || "Deck"}
              </span>
            </h2>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-silver-400" />
            <input
              type="text"
              placeholder="Search front, back, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-bone-300 bg-bone-50 pl-9 pr-3 py-2 text-xs text-silver-900 focus:border-wine-plum-600 focus:outline-none"
            />
          </div>
        </div>

        {matchingExistingCards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-bone-300 p-6 text-center text-xs text-silver-500">
            No matching cards found in this deck — safe to add!
          </div>
        ) : (
          <div className="space-y-2.5">
            {matchingExistingCards.map((card) => {
              const formattedDate = new Date(card.createdAt).toLocaleDateString(
                undefined,
                {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }
              );
              const isAddedToday =
                card.createdAt.slice(0, 10) ===
                new Date().toISOString().slice(0, 10);

              return (
                <div
                  key={card.id}
                  className="flex flex-col justify-between gap-2 rounded-xl border border-bone-200 bg-bone-50/60 p-3.5 sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-silver-900">
                      {card.front}
                    </p>
                    <p className="text-xs text-silver-600">{card.back}</p>
                    {card.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {card.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-md bg-almond-silk-100 px-2 py-0.5 text-[10px] font-semibold text-almond-silk-800"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-start sm:items-end gap-1">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-bone-200/70 px-2.5 py-1 text-[11px] font-semibold text-silver-700">
                      <Calendar className="h-3 w-3 text-wine-plum-600" />
                      Added {formattedDate}
                    </span>
                    {isAddedToday && (
                      <span className="text-[10px] font-bold text-wine-plum-600">
                        • Added Today
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default function AddCardPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-silver-500">
          Loading Add Card workspace...
        </div>
      }
    >
      <AddCardContent />
    </Suspense>
  );
}
