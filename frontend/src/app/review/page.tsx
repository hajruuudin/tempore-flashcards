"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Play,
  Keyboard,
  RotateCcw,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  ArrowLeft,
  Eye,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  DeckSummary,
  DifficultyRating,
  Flashcard,
  ReviewModeType,
} from "@/types";

function ReviewContent() {
  const searchParams = useSearchParams();
  const initialDeckId = searchParams.get("deckId") || "";
  const initialMode =
    (searchParams.get("mode") as ReviewModeType) === "ExactMatch"
      ? "ExactMatch"
      : "Standard";

  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>(initialDeckId);
  const [mode, setMode] = useState<ReviewModeType>(initialMode);
  const [limit, setLimit] = useState<number>(10);
  const [order, setOrder] = useState<string>("random");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("All");

  // Active Session State
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Special Exact-Match Mode State
  const [typedAnswer, setTypedAnswer] = useState("");
  const [exactMatchChecked, setExactMatchChecked] = useState(false);
  const [isExactCorrect, setIsExactCorrect] = useState(false);

  // Session Summary Counters
  const [sessionFinished, setSessionFinished] = useState(false);
  const [tallies, setTallies] = useState({
    Easy: 0,
    Normal: 0,
    Hard: 0,
    exactCorrect: 0,
  });

  useEffect(() => {
    api.getDecks().then((list) => {
      setDecks(list);
      if (!selectedDeckId && list.length > 0) {
        setSelectedDeckId(list[0].id);
      }
    });
  }, []);

  const startSession = async () => {
    if (!selectedDeckId) return;
    const cards = await api.getReviewSession({
      deckId: selectedDeckId,
      limit,
      order,
      difficultyFilter,
    });
    setSessionCards(cards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setTypedAnswer("");
    setExactMatchChecked(false);
    setSessionFinished(false);
    setTallies({ Easy: 0, Normal: 0, Hard: 0, exactCorrect: 0 });
    setSessionStarted(true);
  };

  const currentCard = sessionCards[currentIndex];

  const handleCheckExactMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCard) return;
    // Exact match is strictly only an exact match
    const match = typedAnswer.trim() === currentCard.back.trim();
    setIsExactCorrect(match);
    setExactMatchChecked(true);
    setIsFlipped(true);
  };

  const handleRateCard = async (rating: DifficultyRating) => {
    if (!currentCard) return;

    const result = await api.submitReview({
      deckId: currentCard.deckId,
      cardId: currentCard.id,
      mode,
      rating,
      typedAnswer: mode === "ExactMatch" ? typedAnswer : undefined,
    });

    setTallies((prev) => ({
      ...prev,
      [rating]: prev[rating] + 1,
      exactCorrect:
        prev.exactCorrect +
        (mode === "ExactMatch" && result.isExactMatch ? 1 : 0),
    }));

    if (currentIndex + 1 < sessionCards.length) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setTypedAnswer("");
      setExactMatchChecked(false);
    } else {
      setSessionFinished(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-silver-500 hover:text-wine-plum-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Homescreen</span>
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-silver-900">
            Review Mode
          </h1>
          <p className="text-xs text-silver-600">
            Configure card count, ordering, and choose between Standard Flip or
            Exact-Match Write mode.
          </p>
        </div>

        {sessionStarted && (
          <button
            onClick={() => setSessionStarted(false)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-bone-300 bg-bone-50 px-3 py-2 text-xs font-semibold text-silver-700 hover:bg-bone-100"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Change Options</span>
          </button>
        )}
      </div>

      {/* =====================================================================
          SETUP / CONFIGURATION SCREEN
      ===================================================================== */}
      {!sessionStarted && (
        <div className="rounded-2xl border border-bone-200 bg-white/85 p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-silver-700">
                Select Deck
              </label>
              <select
                value={selectedDeckId}
                onChange={(e) => setSelectedDeckId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-bone-300 bg-bone-50 px-3.5 py-2.5 text-sm font-semibold text-silver-900"
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
                Review Mode
              </label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode("Standard")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                    mode === "Standard"
                      ? "border-wine-plum-700 bg-wine-plum-700 text-bone-50"
                      : "border-bone-300 bg-bone-50 text-silver-700 hover:bg-bone-100"
                  }`}
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Standard Flip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("ExactMatch")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                    mode === "ExactMatch"
                      ? "border-smoky-rose-700 bg-smoky-rose-700 text-bone-50"
                      : "border-bone-300 bg-bone-50 text-silver-700 hover:bg-bone-100"
                  }`}
                >
                  <Keyboard className="h-3.5 w-3.5" />
                  <span>Exact-Match Write</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-silver-700">
                Number of Cards
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-bone-300 bg-white px-3 py-2 text-sm text-silver-900"
              >
                <option value={5}>5 cards</option>
                <option value={10}>10 cards</option>
                <option value={20}>20 cards</option>
                <option value={50}>50 cards</option>
                <option value={0}>All cards in deck</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-silver-700">
                Card Ordering
              </label>
              <select
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-bone-300 bg-white px-3 py-2 text-sm text-silver-900"
              >
                <option value="random">Random Shuffle</option>
                <option value="hardest">Hardest Cards First</option>
                <option value="oldest">Oldest Added First</option>
                <option value="newest">Newest Added First</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-silver-700">
                Filter by Prior Rating
              </label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-bone-300 bg-white px-3 py-2 text-sm text-silver-900"
              >
                <option value="All">All Cards</option>
                <option value="Hard">Previously Rated Hard</option>
                <option value="Normal">Previously Rated Normal</option>
                <option value="Easy">Previously Rated Easy</option>
                <option value="Unreviewed">Unreviewed Only</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={startSession}
              className="inline-flex items-center gap-2 rounded-xl bg-wine-plum-700 px-6 py-3 text-sm font-bold text-bone-50 shadow-sm transition hover:bg-wine-plum-800"
            >
              <Play className="h-4 w-4" />
              <span>Start Review Session</span>
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          ACTIVE SESSION SCREEN
      ===================================================================== */}
      {sessionStarted && !sessionFinished && (
        <>
          {sessionCards.length === 0 ? (
            <div className="rounded-2xl border border-bone-200 bg-white p-8 text-center space-y-3">
              <p className="text-sm font-semibold text-silver-700">
                No cards matched your selected filter in this deck.
              </p>
              <button
                onClick={() => setSessionStarted(false)}
                className="rounded-xl bg-wine-plum-700 px-4 py-2 text-xs font-semibold text-bone-50"
              >
                Adjust Review Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="flex items-center justify-between text-xs font-semibold text-silver-600">
                <span>
                  Card {currentIndex + 1} of {sessionCards.length}
                </span>
                <span className="rounded-full bg-bone-200 px-2.5 py-0.5 text-[11px] font-bold text-silver-800">
                  {mode === "ExactMatch"
                    ? "Exact-Match Write Mode"
                    : "Standard Flip Mode"}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-bone-200">
                <div
                  style={{
                    width: `${Math.round(
                      ((currentIndex + 1) / sessionCards.length) * 100
                    )}%`,
                  }}
                  className="h-full bg-wine-plum-600 transition-all"
                />
              </div>

              {/* Flashcard Container */}
              <div className="rounded-2xl border border-bone-200 bg-white p-6 sm:p-8 shadow-sm min-h-[260px] flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-wine-plum-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-wine-plum-800">
                      Prompt / Front
                    </span>
                    {currentCard.tags.length > 0 && (
                      <div className="flex gap-1">
                        {currentCard.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded bg-almond-silk-100 px-2 py-0.5 text-[10px] font-semibold text-almond-silk-800"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-silver-900 leading-snug">
                    {currentCard.front}
                  </h2>

                  {/* Mode 1: Standard Flip Reveal */}
                  {mode === "Standard" && isFlipped && (
                    <div className="mt-6 border-t border-bone-200 pt-5 space-y-2">
                      <span className="rounded-md bg-bone-200 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-silver-700">
                        Answer / Back
                      </span>
                      <p className="text-lg font-semibold text-wine-plum-800">
                        {currentCard.back}
                      </p>
                    </div>
                  )}

                  {/* Mode 2: Special Exact-Match Write Mode */}
                  {mode === "ExactMatch" && (
                    <div className="mt-6 border-t border-bone-200 pt-5 space-y-4">
                      {!exactMatchChecked ? (
                        <form
                          onSubmit={handleCheckExactMatch}
                          className="space-y-3"
                        >
                          <label className="block text-xs font-bold uppercase tracking-wider text-smoky-rose-700">
                            Write the Exact Answer:
                          </label>
                          <input
                            type="text"
                            autoFocus
                            required
                            placeholder="Type exact match here..."
                            value={typedAnswer}
                            onChange={(e) => setTypedAnswer(e.target.value)}
                            className="w-full rounded-xl border border-bone-300 bg-bone-50 px-4 py-3 text-sm font-semibold text-silver-900 focus:border-wine-plum-600 focus:bg-white focus:outline-none"
                          />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-smoky-rose-700 px-5 py-2.5 text-xs font-bold text-bone-50 hover:bg-smoky-rose-800"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Verify Exact Match</span>
                          </button>
                        </form>
                      ) : (
                        <div className="space-y-3">
                          <div
                            className={`flex items-start gap-2.5 rounded-xl border p-4 ${
                              isExactCorrect
                                ? "border-bone-400 bg-bone-100/80 text-bone-900"
                                : "border-wine-plum-300 bg-wine-plum-50 text-wine-plum-900"
                            }`}
                          >
                            {isExactCorrect ? (
                              <CheckCircle2 className="h-5 w-5 shrink-0 text-bone-700 mt-0.5" />
                            ) : (
                              <XCircle className="h-5 w-5 shrink-0 text-wine-plum-700 mt-0.5" />
                            )}
                            <div className="space-y-1 text-xs">
                              <p className="font-bold text-sm">
                                {isExactCorrect
                                  ? "Exact Match Correct!"
                                  : "Not an Exact Match"}
                              </p>
                              <p>
                                <span className="font-semibold">
                                  Your Answer:
                                </span>{" "}
                                <code className="rounded bg-white px-1.5 py-0.5">
                                  {typedAnswer}
                                </code>
                              </p>
                              <p>
                                <span className="font-semibold">
                                  Expected Exact Match:
                                </span>{" "}
                                <code className="rounded bg-white px-1.5 py-0.5 font-bold">
                                  {currentCard.back}
                                </code>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Action Controls: Reveal or Rate Hard / Normal / Easy */}
                <div className="mt-8 pt-4 border-t border-bone-100">
                  {mode === "Standard" && !isFlipped ? (
                    <button
                      onClick={() => setIsFlipped(true)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-silver-800 py-3 text-sm font-bold text-bone-50 transition hover:bg-silver-900"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Show Answer</span>
                    </button>
                  ) : (
                    (isFlipped || exactMatchChecked) && (
                      <div className="space-y-2">
                        <span className="block text-center text-[11px] font-bold uppercase tracking-wider text-silver-500">
                          Rate Card Difficulty to Continue
                        </span>
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            onClick={() => handleRateCard("Hard")}
                            className="rounded-xl border border-wine-plum-300 bg-wine-plum-100 py-3 text-xs sm:text-sm font-bold text-wine-plum-900 transition hover:bg-wine-plum-700 hover:text-bone-50"
                          >
                            Hard
                          </button>
                          <button
                            onClick={() => handleRateCard("Normal")}
                            className="rounded-xl border border-almond-silk-300 bg-almond-silk-100 py-3 text-xs sm:text-sm font-bold text-almond-silk-900 transition hover:bg-almond-silk-600 hover:text-bone-50"
                          >
                            Normal
                          </button>
                          <button
                            onClick={() => handleRateCard("Easy")}
                            className="rounded-xl border border-bone-400 bg-bone-200 py-3 text-xs sm:text-sm font-bold text-bone-900 transition hover:bg-bone-600 hover:text-bone-50"
                          >
                            Easy
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* =====================================================================
          SESSION COMPLETE SUMMARY
      ===================================================================== */}
      {sessionStarted && sessionFinished && (
        <div className="rounded-2xl border border-bone-200 bg-white p-8 text-center shadow-sm space-y-5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-wine-plum-100 text-wine-plum-700">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-silver-900">
              Review Session Complete!
            </h2>
            <p className="text-xs text-silver-600">
              You reviewed {sessionCards.length} cards in {mode} mode.
            </p>
          </div>

          <div className="mx-auto grid max-w-md grid-cols-3 gap-3">
            <div className="rounded-xl bg-bone-100 p-3">
              <span className="text-xs font-semibold text-bone-800">Easy</span>
              <p className="text-lg font-bold text-silver-900">
                {tallies.Easy}
              </p>
            </div>
            <div className="rounded-xl bg-almond-silk-100 p-3">
              <span className="text-xs font-semibold text-almond-silk-800">
                Normal
              </span>
              <p className="text-lg font-bold text-silver-900">
                {tallies.Normal}
              </p>
            </div>
            <div className="rounded-xl bg-wine-plum-100 p-3">
              <span className="text-xs font-semibold text-wine-plum-800">
                Hard
              </span>
              <p className="text-lg font-bold text-silver-900">
                {tallies.Hard}
              </p>
            </div>
          </div>

          {mode === "ExactMatch" && (
            <p className="text-xs font-bold text-smoky-rose-700">
              Exact-Match Score: {tallies.exactCorrect} / {sessionCards.length}{" "}
              ({Math.round((tallies.exactCorrect / sessionCards.length) * 100)}
              %)
            </p>
          )}

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={startSession}
              className="inline-flex items-center gap-1.5 rounded-xl bg-wine-plum-700 px-5 py-2.5 text-xs font-bold text-bone-50 hover:bg-wine-plum-800"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Review Again</span>
            </button>
            <Link
              href="/stats"
              className="inline-flex items-center gap-1.5 rounded-xl border border-bone-300 bg-bone-50 px-5 py-2.5 text-xs font-bold text-silver-800 hover:bg-bone-100"
            >
              <span>View Updated Stats</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-silver-500">
          Loading Review Mode...
        </div>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}
