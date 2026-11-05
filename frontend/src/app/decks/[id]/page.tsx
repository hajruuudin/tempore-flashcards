"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/api";
import { DeckSummary, Flashcard } from "@/types";

const parseTags = (input: string) =>
  input
    .split(/[;,]/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

export default function DeckCardsViewPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = String(params?.id || "");

  const [deck, setDeck] = useState<DeckSummary | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("ALL");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [editTags, setEditTags] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const loadDeckData = async () => {
    if (!deckId) return;
    const [deckInfo, cardList] = await Promise.all([
      api.getDeck(deckId),
      api.getCards({ deckId }),
    ]);
    setDeck(deckInfo);
    setCards(cardList);
  };

  useEffect(() => {
    loadDeckData();
  }, [deckId]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((c) => c.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [cards]);

  const filteredCards = useMemo(() => {
    const q = search.toLowerCase().trim();
    return cards.filter((c) => {
      if (selectedTag !== "ALL" && !c.tags.includes(selectedTag)) return false;
      if (!q) return true;
      return (
        c.front.toLowerCase().includes(q) ||
        c.back.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [cards, search, selectedTag]);

  const startEditing = (card: Flashcard) => {
    setEditingId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
    setEditTags(card.tags.join(", "));
  };

  const handleSaveEdit = async (cardId: string) => {
    if (!editFront.trim() || !editBack.trim()) return;
    await api.updateCard(cardId, {
      front: editFront,
      back: editBack,
      tags: parseTags(editTags),
      deckId,
    });
    setEditingId(null);
    await loadDeckData();
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Delete this flashcard?")) return;
    await api.deleteCard(cardId);
    await loadDeckData();
  };

  const handleDeleteDeck = async () => {
    if (!deck || !confirm(`Delete deck "${deck.name}" and all its cards?`)) return;
    await api.deleteDeck(deck.id);
    router.push("/");
  };

  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const count = await api.importDeckCsv(deckId, text);
    setImportNotice(`Imported ${count} flashcards from ${file.name}`);
    setTimeout(() => setImportNotice(null), 4000);
    e.target.value = "";
    await loadDeckData();
  };

  const statTiles = [
    { value: deck?.totalCards ?? 0, label: "Cards" },
    { value: deck?.cardsAddedToday ?? 0, label: "Added today" },
    { value: deck?.totalReviews ?? 0, label: "Times reviewed" },
    { value: `${deck?.masteryPercentage ?? 0}%`, label: "Mastery" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Deck" title={deck?.name || "Deck overview"}>
        <Link href="/" className="tf-btn-small">
          Back to homepage
        </Link>
      </PageHeader>

      {deck?.description && (
        <p className="text-sm text-tf-muted">{deck.description}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href={`/add-card?deckId=${deckId}`} className="tf-btn-small py-2">
          Add Cards
        </Link>
        <button
          type="button"
          onClick={() => api.exportDeckCsv(deckId, deck?.name || "deck")}
          className="tf-btn-small py-2"
        >
          Export .CSV
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="tf-btn-small py-2"
        >
          Import .CSV
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleCsvFileChange}
          className="hidden"
        />
        <Link
          href={`/review?deckId=${deckId}&start=1`}
          className="rounded-lg bg-tf-mint px-4 py-2 text-xs font-bold text-white transition hover:brightness-110"
        >
          Review now
        </Link>
        <Link
          href={`/review?deckId=${deckId}&mode=ExactMatch&start=1`}
          className="rounded-lg bg-tf-accent px-4 py-2 text-xs font-bold text-white transition hover:brightness-110"
        >
          Write review
        </Link>
        <button
          type="button"
          onClick={handleDeleteDeck}
          className="rounded-lg bg-tf-rose px-4 py-2 text-xs font-bold text-white transition hover:brightness-110 sm:ml-auto"
        >
          Delete deck
        </button>
      </div>

      {importNotice && (
        <div className="rounded-xl bg-tf-mint/15 px-4 py-2.5 text-sm font-semibold text-tf-mint">
          {importNotice}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statTiles.map((tile) => (
          <div
            key={tile.label}
            className="tf-tile flex flex-col items-center justify-center px-3 py-4 text-center"
          >
            <span className="text-2xl font-bold text-white">{tile.value}</span>
            <span className="text-sm font-light">{tile.label}</span>
          </div>
        ))}
      </div>

      <hr className="tf-divider" />

      <div className="relative">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-tf-muted" />
        <input
          type="text"
          aria-label="Search cards in deck"
          placeholder="Search Cards in deck"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full bg-tf-panel py-3.5 pl-12 pr-6 text-sm font-semibold text-white placeholder:text-white focus:outline-none focus:ring-2 focus:ring-tf-sky/60"
        />
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {["ALL", ...allTags].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`rounded-lg px-3 py-1 text-xs font-bold text-white transition ${
                selectedTag === tag
                  ? "bg-tf-accent"
                  : "bg-tf-tile hover:bg-tf-tile-hover"
              }`}
            >
              {tag === "ALL" ? "All tags" : `#${tag}`}
            </button>
          ))}
        </div>
      )}

      {filteredCards.length === 0 ? (
        <p className="rounded-xl bg-tf-panel p-8 text-center text-sm font-semibold text-tf-muted">
          {cards.length === 0
            ? "This deck has no cards yet."
            : "No cards match your search."}
        </p>
      ) : (
        <ul className="space-y-3">
          {filteredCards.map((card) =>
            editingId === card.id ? (
              <li key={card.id} className="space-y-3 rounded-xl bg-tf-panel p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <textarea
                    rows={2}
                    aria-label="Front"
                    value={editFront}
                    onChange={(e) => setEditFront(e.target.value)}
                    className="tf-input resize-none text-sm"
                  />
                  <textarea
                    rows={2}
                    aria-label="Back"
                    value={editBack}
                    onChange={(e) => setEditBack(e.target.value)}
                    className="tf-input resize-none text-sm"
                  />
                </div>
                <input
                  type="text"
                  aria-label="Tags"
                  placeholder="Tags (comma separated)"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="tf-input py-3 text-sm"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-lg bg-tf-rose px-5 py-1.5 text-sm font-bold text-white hover:brightness-110"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(card.id)}
                    className="rounded-lg bg-tf-mint px-5 py-1.5 text-sm font-bold text-white hover:brightness-110"
                  >
                    Save
                  </button>
                </div>
              </li>
            ) : (
              <li
                key={card.id}
                className="flex flex-col gap-3 rounded-xl bg-tf-row px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="break-words font-semibold text-white">{card.front}</p>
                  <p className="break-words text-sm text-tf-muted">{card.back}</p>
                  {card.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {card.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-tf-tile px-2 py-0.5 text-[10px] font-bold text-tf-sky"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => startEditing(card)}
                    className="tf-btn-small w-24"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCard(card.id)}
                    className="w-24 rounded-lg bg-tf-rose py-1.5 text-xs font-bold text-white hover:brightness-110"
                  >
                    Delete
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}
