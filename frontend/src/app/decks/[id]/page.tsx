"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  PlusCircle,
  Play,
  Download,
  Upload,
  Search,
  Edit3,
  Trash2,
  Calendar,
  Check,
  X,
  Keyboard,
} from "lucide-react";
import { api } from "@/lib/api";
import { DeckSummary, Flashcard } from "@/types";

export default function DeckCardsViewPage() {
  const params = useParams();
  const deckId = String(params?.id || "");

  const [deck, setDeck] = useState<DeckSummary | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("ALL");

  // Inline card editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [editTags, setEditTags] = useState("");

  // CSV Import feedback
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
    return cards.filter((c) => {
      if (selectedTag !== "ALL" && !c.tags.includes(selectedTag)) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const inFront = c.front.toLowerCase().includes(q);
        const inBack = c.back.toLowerCase().includes(q);
        const inTags = c.tags.some((t) => t.toLowerCase().includes(q));
        if (!inFront && !inBack && !inTags) return false;
      }
      return true;
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
    const tags = editTags
      .split(/[;,]/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    await api.updateCard(cardId, {
      front: editFront,
      back: editBack,
      tags,
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

  const handleCsvFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const count = await api.importDeckCsv(deckId, text);
    setImportNotice(`Imported ${count} flashcards from ${file.name}`);
    setTimeout(() => setImportNotice(null), 4000);
    e.target.value = "";
    await loadDeckData();
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-silver-500 hover:text-wine-plum-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to All Decks</span>
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-silver-900">
            {deck?.name || "Deck Overview"}
          </h1>
          {deck?.description && (
            <p className="text-xs text-silver-600">{deck.description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/add-card?deckId=${deckId}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-bone-300 bg-bone-50 px-3 py-2 text-xs font-semibold text-silver-800 hover:bg-bone-100"
          >
            <PlusCircle className="h-4 w-4 text-wine-plum-600" />
            <span>Add Card</span>
          </Link>

          <button
            onClick={() => api.exportDeckCsv(deckId, deck?.name || "deck")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-bone-300 bg-bone-50 px-3 py-2 text-xs font-semibold text-silver-800 hover:bg-bone-100"
          >
            <Download className="h-4 w-4 text-almond-silk-600" />
            <span>Export .CSV</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-bone-300 bg-bone-50 px-3 py-2 text-xs font-semibold text-silver-800 hover:bg-bone-100"
          >
            <Upload className="h-4 w-4 text-smoky-rose-600" />
            <span>Import .CSV</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleCsvFileChange}
            className="hidden"
          />

          <Link
            href={`/review?deckId=${deckId}&mode=Standard`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-wine-plum-700 px-3.5 py-2 text-xs font-semibold text-bone-50 hover:bg-wine-plum-800"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Review</span>
          </Link>

          <Link
            href={`/review?deckId=${deckId}&mode=ExactMatch`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-smoky-rose-700 px-3.5 py-2 text-xs font-semibold text-bone-50 hover:bg-smoky-rose-800"
          >
            <Keyboard className="h-3.5 w-3.5" />
            <span>Exact Match</span>
          </Link>
        </div>
      </div>

      {importNotice && (
        <div className="rounded-xl border border-wine-plum-200 bg-wine-plum-50 px-4 py-2.5 text-xs font-semibold text-wine-plum-800">
          {importNotice}
        </div>
      )}

      {/* Deck Mini Stats Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-bone-200 bg-white/80 p-3">
          <span className="text-[11px] font-medium text-silver-500">
            Total Cards
          </span>
          <p className="text-xl font-bold text-silver-900">
            {deck?.totalCards ?? cards.length}
          </p>
        </div>
        <div className="rounded-xl border border-bone-200 bg-white/80 p-3">
          <span className="text-[11px] font-medium text-silver-500">
            Added Today
          </span>
          <p className="text-xl font-bold text-wine-plum-700">
            +{deck?.cardsAddedToday ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-bone-200 bg-white/80 p-3">
          <span className="text-[11px] font-medium text-silver-500">
            Mastery
          </span>
          <p className="text-xl font-bold text-almond-silk-700">
            {deck?.masteryPercentage ?? 0}%
          </p>
        </div>
        <div className="rounded-xl border border-bone-200 bg-white/80 p-3">
          <span className="text-[11px] font-medium text-silver-500">
            Total Reviews
          </span>
          <p className="text-xl font-bold text-silver-900">
            {deck?.totalReviews ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-bone-200 bg-white/80 p-3 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-medium text-silver-500">
            E / N / H Split
          </span>
          <p className="text-sm font-bold text-silver-900 mt-1">
            {deck?.easyCount ?? 0}E • {deck?.normalCount ?? 0}N •{" "}
            {deck?.hardCount ?? 0}H
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-bone-200 bg-white/85 p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-silver-400" />
            <input
              type="text"
              placeholder="Filter cards in this deck by front, back, or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-bone-300 bg-bone-50 pl-9 pr-3.5 py-2 text-xs text-silver-900 focus:border-wine-plum-600 focus:outline-none"
            />
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedTag("ALL")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  selectedTag === "ALL"
                    ? "bg-silver-800 text-bone-50"
                    : "bg-bone-100 text-silver-700 hover:bg-bone-200"
                }`}
              >
                All Tags
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                    selectedTag === tag
                      ? "bg-wine-plum-700 text-bone-50"
                      : "bg-almond-silk-100 text-almond-silk-800 hover:bg-almond-silk-200"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cards List */}
        {filteredCards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-bone-300 p-8 text-center text-xs text-silver-500">
            No flashcards match your filter in this deck.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCards.map((card) => {
              const isEditing = editingId === card.id;
              const dateAdded = new Date(card.createdAt).toLocaleDateString(
                undefined,
                {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }
              );

              return (
                <div
                  key={card.id}
                  className="rounded-xl border border-bone-200 bg-bone-50/50 p-4 transition hover:bg-white"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-[11px] font-bold uppercase text-silver-600">
                            Front
                          </label>
                          <textarea
                            rows={2}
                            value={editFront}
                            onChange={(e) => setEditFront(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-bone-300 bg-white p-2 text-xs text-silver-900"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold uppercase text-silver-600">
                            Back
                          </label>
                          <textarea
                            rows={2}
                            value={editBack}
                            onChange={(e) => setEditBack(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-bone-300 bg-white p-2 text-xs text-silver-900"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          placeholder="Tags (comma separated)"
                          value={editTags}
                          onChange={(e) => setEditTags(e.target.value)}
                          className="flex-1 rounded-lg border border-bone-300 bg-white px-3 py-1.5 text-xs text-silver-900"
                        />
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingId(null)}
                            className="inline-flex items-center gap-1 rounded-lg bg-bone-200 px-3 py-1.5 text-xs font-semibold text-silver-700"
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(card.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-wine-plum-700 px-3 py-1.5 text-xs font-semibold text-bone-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-wine-plum-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-wine-plum-800">
                            Front
                          </span>
                          <h3 className="text-sm font-bold text-silver-900">
                            {card.front}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-bone-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-silver-700">
                            Back
                          </span>
                          <p className="text-xs font-medium text-silver-700">
                            {card.back}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {card.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-md bg-almond-silk-100 px-2 py-0.5 text-[10px] font-semibold text-almond-silk-800"
                            >
                              #{t}
                            </span>
                          ))}
                          <span className="inline-flex items-center gap-1 text-[11px] text-silver-500">
                            <Calendar className="h-3 w-3" />
                            Added {dateAdded}
                          </span>
                          {card.lastDifficulty && (
                            <span className="rounded-md bg-bone-200/80 px-2 py-0.5 text-[10px] font-semibold text-silver-700">
                              Last: {card.lastDifficulty} ({card.reviewCount}{" "}
                              reviews)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 self-end sm:self-start">
                        <button
                          onClick={() => startEditing(card)}
                          className="rounded-lg p-1.5 text-silver-500 hover:bg-bone-200 hover:text-silver-900"
                          title="Edit card"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="rounded-lg p-1.5 text-silver-500 hover:bg-smoky-rose-100 hover:text-smoky-rose-700"
                          title="Delete card"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
