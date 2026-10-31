"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Play,
  FolderPlus,
  Layers,
  Folder as FolderIcon,
  BarChart3,
  Keyboard,
  ArrowRight,
  Trash2,
  Download,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import { DeckSummary, Folder, OverallStats } from "@/types";

export default function HomePage() {
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("ALL");
  const [quickDeckId, setQuickDeckId] = useState<string>("");

  // Modals / inline creation forms
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDesc, setNewFolderDesc] = useState("");

  const [showNewDeck, setShowNewDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckDesc, setNewDeckDesc] = useState("");
  const [newDeckFolderId, setNewDeckFolderId] = useState("");

  const loadData = async () => {
    const [overall, folderList, deckList] = await Promise.all([
      api.getOverallStats(),
      api.getFolders(),
      api.getDecks(),
    ]);
    setStats(overall);
    setFolders(folderList);
    setDecks(deckList);
    if (!quickDeckId && deckList.length > 0) {
      setQuickDeckId(deckList[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await api.createFolder({
      name: newFolderName,
      description: newFolderDesc,
      color: "wine-plum",
    });
    setNewFolderName("");
    setNewFolderDesc("");
    setShowNewFolder(false);
    await loadData();
  };

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;
    const created = await api.createDeck({
      name: newDeckName,
      description: newDeckDesc,
      folderId: newDeckFolderId || null,
    });
    setNewDeckName("");
    setNewDeckDesc("");
    setNewDeckFolderId("");
    setShowNewDeck(false);
    await loadData();
    if (created?.id) setQuickDeckId(created.id);
  };

  const handleDeleteDeck = async (id: string, name: string) => {
    if (!confirm(`Delete deck "${name}" and all its cards?`)) return;
    await api.deleteDeck(id);
    await loadData();
  };

  const handleDeleteFolder = async (id: string, name: string) => {
    if (
      !confirm(
        `Remove folder "${name}"? Decks inside will be kept and moved to Uncategorized.`
      )
    )
      return;
    await api.deleteFolder(id);
    if (selectedFolderId === id) setSelectedFolderId("ALL");
    await loadData();
  };

  const filteredDecks =
    selectedFolderId === "ALL"
      ? decks
      : selectedFolderId === "UNCATEGORIZED"
      ? decks.filter((d) => !d.folderId)
      : decks.filter((d) => d.folderId === selectedFolderId);

  const totalDifficultyCount =
    (stats?.hardTotal || 0) +
    (stats?.normalTotal || 0) +
    (stats?.easyTotal || 0);
  const easyPct =
    totalDifficultyCount > 0
      ? Math.round(((stats?.easyTotal || 0) / totalDifficultyCount) * 100)
      : 0;
  const normalPct =
    totalDifficultyCount > 0
      ? Math.round(((stats?.normalTotal || 0) / totalDifficultyCount) * 100)
      : 0;
  const hardPct =
    totalDifficultyCount > 0 ? Math.max(0, 100 - easyPct - normalPct) : 0;

  return (
    <div className="space-y-8">
      {/* Welcoming Message */}
      <section className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-wine-plum-100 px-3 py-1 text-xs font-semibold text-wine-plum-700">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Ready for daily retention</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-silver-900">
          Welcome back to your study workspace.
        </h1>
        <p className="text-sm text-silver-600">
          Add new flashcards, practice active recall or exact-match writing, and
          track your progress across every deck.
        </p>
      </section>

      {/* =====================================================================
          WIDGET 1: ADD NEW CARDS & REVIEW MODE
      ===================================================================== */}
      <section className="rounded-2xl border border-bone-200 bg-white/80 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-wine-plum-600">
              Quick Actions
            </span>
            <h2 className="text-lg font-bold text-silver-900">
              Add Cards &amp; Launch Review Mode
            </h2>
            <p className="text-xs text-silver-500">
              Select an active deck below or jump straight into creating and
              reviewing cards.
            </p>
          </div>

          {decks.length > 0 && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="quick-deck"
                className="text-xs font-semibold text-silver-600 whitespace-nowrap"
              >
                Active Deck:
              </label>
              <select
                id="quick-deck"
                value={quickDeckId}
                onChange={(e) => setQuickDeckId(e.target.value)}
                className="rounded-xl border border-bone-300 bg-bone-50 px-3 py-2 text-xs font-semibold text-silver-800 focus:border-wine-plum-600 focus:outline-none"
              >
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.totalCards} cards)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href={
              quickDeckId ? `/add-card?deckId=${quickDeckId}` : "/add-card"
            }
            className="group flex flex-col justify-between rounded-xl border border-wine-plum-200 bg-wine-plum-50/70 p-4 transition hover:border-wine-plum-400 hover:bg-wine-plum-100/60"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-wine-plum-700 p-2 text-bone-50">
                <PlusCircle className="h-5 w-5" />
              </span>
              <ArrowRight className="h-4 w-4 text-wine-plum-600 transition-transform group-hover:translate-x-1" />
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-wine-plum-900">Add New Cards</h3>
              <p className="mt-0.5 text-xs text-wine-plum-700">
                Create front &amp; back cards with live duplicate search
              </p>
            </div>
          </Link>

          <Link
            href={
              quickDeckId
                ? `/review?deckId=${quickDeckId}&mode=Standard`
                : "/review?mode=Standard"
            }
            className="group flex flex-col justify-between rounded-xl border border-almond-silk-200 bg-almond-silk-50/80 p-4 transition hover:border-almond-silk-400 hover:bg-almond-silk-100/70"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-almond-silk-600 p-2 text-bone-50">
                <Play className="h-5 w-5" />
              </span>
              <ArrowRight className="h-4 w-4 text-almond-silk-700 transition-transform group-hover:translate-x-1" />
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-almond-silk-900">
                Standard Review
              </h3>
              <p className="mt-0.5 text-xs text-almond-silk-700">
                Flip cards and rate Hard, Normal, or Easy
              </p>
            </div>
          </Link>

          <Link
            href={
              quickDeckId
                ? `/review?deckId=${quickDeckId}&mode=ExactMatch`
                : "/review?mode=ExactMatch"
            }
            className="group flex flex-col justify-between rounded-xl border border-smoky-rose-200 bg-smoky-rose-50/80 p-4 transition hover:border-smoky-rose-400 hover:bg-smoky-rose-100/70"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-smoky-rose-700 p-2 text-bone-50">
                <Keyboard className="h-5 w-5" />
              </span>
              <ArrowRight className="h-4 w-4 text-smoky-rose-700 transition-transform group-hover:translate-x-1" />
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-smoky-rose-900">
                Exact-Match Write Mode
              </h3>
              <p className="mt-0.5 text-xs text-smoky-rose-700">
                Type the exact answer to verify strict mastery
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* =====================================================================
          WIDGET 2: STATISTICAL OVERVIEW BLOCK
      ===================================================================== */}
      <section className="rounded-2xl border border-bone-200 bg-white/80 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-almond-silk-600">
              Performance Snapshot
            </span>
            <h2 className="text-lg font-bold text-silver-900">
              Statistical Overview
            </h2>
          </div>
          <Link
            href="/stats"
            className="inline-flex items-center gap-1.5 rounded-xl bg-bone-100 px-3 py-1.5 text-xs font-semibold text-silver-800 transition hover:bg-bone-200"
          >
            <BarChart3 className="h-3.5 w-3.5 text-wine-plum-600" />
            <span>Full Analytics</span>
          </Link>
        </div>

        {/* KPI Metric Pills */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-bone-200 bg-bone-50/70 p-3.5">
            <span className="text-xs font-medium text-silver-500">
              Total Flashcards
            </span>
            <p className="mt-1 text-2xl font-bold text-silver-900">
              {stats?.totalCards ?? 0}
            </p>
            <span className="text-[11px] font-medium text-wine-plum-600">
              +{stats?.cardsAddedToday ?? 0} added today
            </span>
          </div>

          <div className="rounded-xl border border-bone-200 bg-bone-50/70 p-3.5">
            <span className="text-xs font-medium text-silver-500">
              Total Reviews
            </span>
            <p className="mt-1 text-2xl font-bold text-silver-900">
              {stats?.totalReviews ?? 0}
            </p>
            <span className="text-[11px] font-medium text-almond-silk-600">
              {stats?.reviewsToday ?? 0} reviewed today
            </span>
          </div>

          <div className="rounded-xl border border-bone-200 bg-bone-50/70 p-3.5">
            <span className="text-xs font-medium text-silver-500">
              Exact-Match Accuracy
            </span>
            <p className="mt-1 text-2xl font-bold text-silver-900">
              {stats?.exactMatchAccuracy ?? 0}%
            </p>
            <span className="text-[11px] font-medium text-smoky-rose-600">
              Strict typing mode
            </span>
          </div>

          <div className="rounded-xl border border-bone-200 bg-bone-50/70 p-3.5">
            <span className="text-xs font-medium text-silver-500">
              Decks &amp; Folders
            </span>
            <p className="mt-1 text-2xl font-bold text-silver-900">
              {stats?.totalDecks ?? 0}
            </p>
            <span className="text-[11px] font-medium text-silver-500">
              Across {stats?.totalFolders ?? 0} folders
            </span>
          </div>
        </div>

        {/* Graphical Representations: 7-Day Activity & Difficulty Breakdown */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* 7-Day Activity Mini Bar Chart */}
          <div className="rounded-xl border border-bone-200 bg-bone-50/40 p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-silver-700">
              <span>Last 7 Days Activity</span>
              <span className="text-[11px] text-silver-500">
                Reviews vs. Added
              </span>
            </div>
            <div className="mt-4 flex h-28 items-end justify-between gap-2 pt-2">
              {(stats?.last7DaysActivity || []).map((pt) => {
                const maxVal = Math.max(
                  1,
                  ...(stats?.last7DaysActivity.map((x) =>
                    Math.max(x.reviewsCount, x.cardsAddedCount)
                  ) || [1])
                );
                const revHeight = Math.max(
                  8,
                  Math.round((pt.reviewsCount / maxVal) * 76)
                );
                const addHeight = Math.max(
                  8,
                  Math.round((pt.cardsAddedCount / maxVal) * 76)
                );

                return (
                  <div
                    key={pt.date}
                    className="flex flex-1 flex-col items-center gap-1.5"
                  >
                    <div className="flex w-full items-end justify-center gap-1 h-20">
                      <div
                        title={`${pt.reviewsCount} reviews`}
                        style={{ height: `${revHeight}px` }}
                        className="w-2.5 rounded-t bg-wine-plum-600 transition-all"
                      />
                      <div
                        title={`${pt.cardsAddedCount} cards added`}
                        style={{ height: `${addHeight}px` }}
                        className="w-2.5 rounded-t bg-bone-400 transition-all"
                      />
                    </div>
                    <span className="text-[10px] font-medium text-silver-500">
                      {pt.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Difficulty Distribution Graphic */}
          <div className="rounded-xl border border-bone-200 bg-bone-50/40 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-silver-700">
                <span>Response Distribution</span>
                <span className="text-[11px] text-silver-500">
                  Hard / Normal / Easy
                </span>
              </div>

              <div className="mt-4 h-4 w-full overflow-hidden rounded-full bg-bone-200 flex">
                <div
                  style={{ width: `${easyPct}%` }}
                  className="bg-bone-500 transition-all"
                  title={`Easy: ${easyPct}%`}
                />
                <div
                  style={{ width: `${normalPct}%` }}
                  className="bg-almond-silk-500 transition-all"
                  title={`Normal: ${normalPct}%`}
                />
                <div
                  style={{ width: `${hardPct}%` }}
                  className="bg-wine-plum-700 transition-all"
                  title={`Hard: ${hardPct}%`}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-bone-100 p-2">
                <span className="text-[11px] font-semibold text-bone-800">
                  Easy
                </span>
                <p className="text-sm font-bold text-silver-900">
                  {stats?.easyTotal ?? 0} ({easyPct}%)
                </p>
              </div>
              <div className="rounded-lg bg-almond-silk-100/70 p-2">
                <span className="text-[11px] font-semibold text-almond-silk-800">
                  Normal
                </span>
                <p className="text-sm font-bold text-silver-900">
                  {stats?.normalTotal ?? 0} ({normalPct}%)
                </p>
              </div>
              <div className="rounded-lg bg-wine-plum-100/70 p-2">
                <span className="text-[11px] font-semibold text-wine-plum-800">
                  Hard
                </span>
                <p className="text-sm font-bold text-silver-900">
                  {stats?.hardTotal ?? 0} ({hardPct}%)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          WIDGET 3: ALL DECKS & FOLDERS VIEW
      ===================================================================== */}
      <section className="rounded-2xl border border-bone-200 bg-white/80 p-6 shadow-sm space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-smoky-rose-600">
              Library Organization
            </span>
            <h2 className="text-lg font-bold text-silver-900">
              All Decks &amp; Folders
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setShowNewFolder(!showNewFolder);
                setShowNewDeck(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-bone-300 bg-bone-50 px-3 py-2 text-xs font-semibold text-silver-800 transition hover:bg-bone-100"
            >
              <FolderPlus className="h-4 w-4 text-almond-silk-600" />
              <span>New Folder</span>
            </button>
            <button
              onClick={() => {
                setShowNewDeck(!showNewDeck);
                setShowNewFolder(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-wine-plum-700 px-3.5 py-2 text-xs font-semibold text-bone-50 shadow-sm transition hover:bg-wine-plum-800"
            >
              <PlusCircle className="h-4 w-4" />
              <span>New Deck</span>
            </button>
          </div>
        </div>

        {/* Create Folder Inline Form */}
        {showNewFolder && (
          <form
            onSubmit={handleCreateFolder}
            className="rounded-xl border border-almond-silk-200 bg-almond-silk-50/60 p-4 space-y-3"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-almond-silk-800">
              Create New Folder
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="text"
                required
                placeholder="Folder name (e.g., Cloud Certifications)"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="rounded-xl border border-bone-300 bg-white px-3 py-2 text-sm text-silver-900 focus:border-wine-plum-600 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Optional description"
                value={newFolderDesc}
                onChange={(e) => setNewFolderDesc(e.target.value)}
                className="rounded-xl border border-bone-300 bg-white px-3 py-2 text-sm text-silver-900 focus:border-wine-plum-600 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewFolder(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-silver-600 hover:bg-bone-200/60"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-wine-plum-700 px-4 py-1.5 text-xs font-semibold text-bone-50 hover:bg-wine-plum-800"
              >
                Save Folder
              </button>
            </div>
          </form>
        )}

        {/* Create Deck Inline Form */}
        {showNewDeck && (
          <form
            onSubmit={handleCreateDeck}
            className="rounded-xl border border-wine-plum-200 bg-wine-plum-50/50 p-4 space-y-3"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-wine-plum-800">
              Create New Deck
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                type="text"
                required
                placeholder="Deck name (e.g., C# Async Patterns)"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                className="rounded-xl border border-bone-300 bg-white px-3 py-2 text-sm text-silver-900 focus:border-wine-plum-600 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Short description"
                value={newDeckDesc}
                onChange={(e) => setNewDeckDesc(e.target.value)}
                className="rounded-xl border border-bone-300 bg-white px-3 py-2 text-sm text-silver-900 focus:border-wine-plum-600 focus:outline-none"
              />
              <select
                value={newDeckFolderId}
                onChange={(e) => setNewDeckFolderId(e.target.value)}
                className="rounded-xl border border-bone-300 bg-white px-3 py-2 text-sm text-silver-800 focus:border-wine-plum-600 focus:outline-none"
              >
                <option value="">No Folder (Root)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    Folder: {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewDeck(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-silver-600 hover:bg-bone-200/60"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-wine-plum-700 px-4 py-1.5 text-xs font-semibold text-bone-50 hover:bg-wine-plum-800"
              >
                Create Deck
              </button>
            </div>
          </form>
        )}

        {/* Folder Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-bone-200 pb-3">
          <button
            onClick={() => setSelectedFolderId("ALL")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              selectedFolderId === "ALL"
                ? "bg-silver-800 text-bone-50"
                : "bg-bone-100 text-silver-700 hover:bg-bone-200"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All Decks ({decks.length})</span>
          </button>

          {folders.map((folder) => {
            const count = decks.filter((d) => d.folderId === folder.id).length;
            const active = selectedFolderId === folder.id;
            return (
              <div
                key={folder.id}
                className={`inline-flex items-center rounded-xl text-xs font-semibold transition ${
                  active
                    ? "bg-wine-plum-700 text-bone-50"
                    : "bg-bone-100 text-silver-700 hover:bg-bone-200"
                }`}
              >
                <button
                  onClick={() => setSelectedFolderId(folder.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5"
                >
                  <FolderIcon className="h-3.5 w-3.5" />
                  <span>
                    {folder.name} ({count})
                  </span>
                </button>
                <button
                  onClick={() => handleDeleteFolder(folder.id, folder.name)}
                  title="Delete folder"
                  className="pr-2.5 pl-1 opacity-60 hover:opacity-100"
                >
                  ×
                </button>
              </div>
            );
          })}

          <button
            onClick={() => setSelectedFolderId("UNCATEGORIZED")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              selectedFolderId === "UNCATEGORIZED"
                ? "bg-silver-800 text-bone-50"
                : "bg-bone-100 text-silver-600 hover:bg-bone-200"
            }`}
          >
            <span>
              Uncategorized ({decks.filter((d) => !d.folderId).length})
            </span>
          </button>
        </div>

        {/* Decks Grid */}
        {filteredDecks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-bone-300 p-8 text-center">
            <p className="text-sm font-medium text-silver-600">
              No decks in this view yet. Create a new deck above to begin!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filteredDecks.map((deck) => (
              <div
                key={deck.id}
                className="flex flex-col justify-between rounded-xl border border-bone-200 bg-bone-50/50 p-4 transition hover:border-almond-silk-300 hover:bg-white"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {deck.folderName && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-almond-silk-100 px-2 py-0.5 text-[10px] font-semibold text-almond-silk-800">
                          <FolderIcon className="h-2.5 w-2.5" />
                          {deck.folderName}
                        </span>
                      )}
                      <Link
                        href={`/decks/${deck.id}`}
                        className="mt-1 block text-base font-bold text-silver-900 hover:text-wine-plum-700"
                      >
                        {deck.name}
                      </Link>
                    </div>
                    <button
                      onClick={() => handleDeleteDeck(deck.id, deck.name)}
                      className="rounded-lg p-1.5 text-silver-400 hover:bg-smoky-rose-100 hover:text-smoky-rose-700"
                      title="Delete deck"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {deck.description && (
                    <p className="mt-1 text-xs text-silver-600 line-clamp-2">
                      {deck.description}
                    </p>
                  )}

                  {/* Per-Deck Mini Stats */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                    <span className="rounded-lg bg-bone-200/70 px-2 py-1 text-silver-800">
                      {deck.totalCards} cards
                    </span>
                    <span className="rounded-lg bg-wine-plum-100/80 px-2 py-1 text-wine-plum-800">
                      +{deck.cardsAddedToday} today
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-almond-silk-100 px-2 py-1 text-almond-silk-800">
                      <CheckCircle2 className="h-3 w-3" />
                      {deck.masteryPercentage}% mastery
                    </span>
                  </div>
                </div>

                {/* Deck Card Action Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-bone-200/80 pt-3">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/decks/${deck.id}`}
                      className="rounded-lg bg-bone-200/70 px-2.5 py-1.5 text-xs font-semibold text-silver-800 hover:bg-bone-300/70"
                    >
                      View Cards
                    </Link>
                    <Link
                      href={`/add-card?deckId=${deck.id}`}
                      className="rounded-lg bg-bone-100 px-2.5 py-1.5 text-xs font-semibold text-silver-700 hover:bg-bone-200"
                    >
                      + Add
                    </Link>
                    <button
                      onClick={() => api.exportDeckCsv(deck.id, deck.name)}
                      title="Export deck to .CSV"
                      className="rounded-lg bg-bone-100 p-1.5 text-silver-600 hover:bg-bone-200 hover:text-silver-900"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <Link
                    href={`/review?deckId=${deck.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-wine-plum-700 px-3 py-1.5 text-xs font-semibold text-bone-50 hover:bg-wine-plum-800"
                  >
                    <Play className="h-3 w-3" />
                    <span>Review</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
