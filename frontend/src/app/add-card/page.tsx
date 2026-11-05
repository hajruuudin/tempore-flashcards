"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/api";
import { DeckSummary, Flashcard } from "@/types";

const PAGE_SIZE = 30;

function AddCardContent() {
  const searchParams = useSearchParams();
  const initialDeckId = searchParams.get("deckId") || "";

  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>(initialDeckId);
  const [deckCards, setDeckCards] = useState<Flashcard[]>([]);

  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const loadDecks = useCallback(async () => {
    const list = await api.getDecks();
    setDecks(list);
    setSelectedDeckId((current) => current || list[0]?.id || "");
  }, []);

  const loadDeckCards = useCallback(async (deckId: string) => {
    if (!deckId) {
      setDeckCards([]);
      return;
    }
    setDeckCards(await api.getCards({ deckId }));
  }, []);

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    loadDeckCards(selectedDeckId);
  }, [selectedDeckId, loadDeckCards]);

  const addedToday = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return deckCards.filter((c) => c.createdAt.slice(0, 10) === todayStr).length;
  }, [deckCards]);

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return deckCards;
    return deckCards.filter(
      (c) =>
        c.front.toLowerCase().includes(q) ||
        c.back.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [deckCards, searchQuery]);

  const exactDuplicateExists = useMemo(() => {
    if (!front.trim()) return false;
    return deckCards.some(
      (c) => c.front.trim().toLowerCase() === front.trim().toLowerCase()
    );
  }, [deckCards, front]);

  const flash = (message: string) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeckId || !front.trim() || !back.trim()) return;

    await api.createCard({ deckId: selectedDeckId, front, back, tags: [] });
    setFront("");
    setBack("");
    flash("Flashcard added to deck!");
    await Promise.all([loadDeckCards(selectedDeckId), loadDecks()]);
  };

  const handleDelete = async (card: Flashcard) => {
    if (!confirm(`Delete the card "${card.front}"?`)) return;
    await api.deleteCard(card.id);
    await Promise.all([loadDeckCards(selectedDeckId), loadDecks()]);
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Add Cards" title="Add New cards to deck" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
        <select
          aria-label="Select deck"
          value={selectedDeckId}
          onChange={(e) => setSelectedDeckId(e.target.value)}
          className="tf-input cursor-pointer py-3.5 [&>option]:bg-tf-panel"
        >
          {decks.length === 0 && <option value="">No decks yet</option>}
          {decks.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.totalCards} cards)
            </option>
          ))}
        </select>
        <div className="tf-tile flex min-w-[170px] flex-col items-center justify-center px-4 py-2">
          <span className="text-2xl font-bold leading-tight text-white">
            {addedToday}
          </span>
          <span className="text-xs font-bold text-white">Card added today</span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]"
      >
        <div>
          <textarea
            required
            rows={2}
            aria-label="Front"
            placeholder="Front"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            className="tf-input h-full min-h-[88px] resize-none text-sm"
          />
          {exactDuplicateExists && (
            <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-tf-rose">
              <AlertCircle className="h-3.5 w-3.5" />
              Identical front already exists in this deck!
            </p>
          )}
        </div>
        <textarea
          required
          rows={2}
          aria-label="Back"
          placeholder="Back"
          value={back}
          onChange={(e) => setBack(e.target.value)}
          className="tf-input min-h-[88px] resize-none text-sm"
        />
        <button
          type="submit"
          disabled={!selectedDeckId}
          className="tf-btn-primary min-h-[88px] px-8 text-xl"
        >
          Add Card
        </button>
      </form>

      <div className="h-5 text-sm font-semibold text-tf-mint" aria-live="polite">
        {statusMessage && (
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            {statusMessage}
          </span>
        )}
      </div>

      <hr className="tf-divider" />

      <div className="relative">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-tf-muted" />
        <input
          type="text"
          aria-label="Search cards in deck"
          placeholder="Search Cards in deck"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          className="w-full rounded-full bg-tf-panel py-3.5 pl-12 pr-6 text-sm font-semibold text-white placeholder:text-white focus:outline-none focus:ring-2 focus:ring-tf-sky/60"
        />
      </div>

      {filteredCards.length === 0 ? (
        <p className="rounded-xl bg-tf-panel p-8 text-center text-sm font-semibold text-tf-muted">
          {deckCards.length === 0
            ? "This deck has no cards yet — add your first one above."
            : "No matching cards found in this deck — safe to add!"}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-x-8 gap-y-10 pt-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCards.slice(0, visibleCount).map((card) => (
              <div key={card.id} className="flex flex-col items-center gap-2.5">
                <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-tf-sky/80 bg-tf-tile px-6 text-center">
                  <p className="line-clamp-4 w-full break-words text-base font-bold text-white">
                    {card.front}
                  </p>
                  <div className="h-px w-4/5 bg-tf-text/90" />
                  <p className="line-clamp-4 w-full break-words text-base font-bold text-white">
                    {card.back}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(card)}
                  className="rounded-lg bg-tf-rose px-8 py-1 text-sm font-bold text-white transition hover:brightness-110"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
          {filteredCards.length > visibleCount && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="tf-btn-small px-6 py-2"
              >
                Show more ({filteredCards.length - visibleCount} left)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AddCardPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-tf-muted">Loading…</div>
      }
    >
      <AddCardContent />
    </Suspense>
  );
}
