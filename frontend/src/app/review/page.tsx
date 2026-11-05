"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ReviewOptionsForm from "@/components/ReviewOptionsForm";
import { api } from "@/lib/api";
import {
  DEFAULT_REVIEW_OPTIONS,
  ReviewOptions,
  reviewOptionsFromParams,
} from "@/lib/review";
import { DeckSummary, DifficultyRating, Flashcard } from "@/types";

const RATINGS: {
  rating: DifficultyRating;
  label: string;
  className: string;
}[] = [
  { rating: "Hard", label: "Wrong", className: "bg-tf-rose" },
  { rating: "Normal", label: "Half-answer", className: "bg-tf-amber" },
  { rating: "Easy", label: "Right", className: "bg-tf-mint" },
];

function ReviewContent() {
  const searchParams = useSearchParams();

  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [options, setOptions] = useState<ReviewOptions>(() =>
    reviewOptionsFromParams(searchParams)
  );

  const [sessionStarted, setSessionStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionOptions, setSessionOptions] = useState<ReviewOptions | null>(null);
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [typedAnswer, setTypedAnswer] = useState("");
  const [exactMatchChecked, setExactMatchChecked] = useState(false);
  const [isExactCorrect, setIsExactCorrect] = useState(false);

  const [sessionFinished, setSessionFinished] = useState(false);
  const [tallies, setTallies] = useState({
    Easy: 0,
    Normal: 0,
    Hard: 0,
    exactCorrect: 0,
  });

  const startSession = async (opts: ReviewOptions) => {
    if (!opts.deckId || loading) return;
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      // Today's filter runs client-side, so fetch everything before limiting
      let cards = await api.getReviewSession({
        deckId: opts.deckId,
        limit: opts.todayOnly ? 0 : opts.limit,
        order: opts.order,
        difficultyFilter: opts.weakOnly ? "Hard" : "All",
      });
      if (opts.todayOnly) {
        cards = cards.filter((c) => c.createdAt.slice(0, 10) === todayStr);
        if (opts.limit > 0) cards = cards.slice(0, opts.limit);
      }
      setSessionOptions(opts);
      setSessionCards(cards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setTypedAnswer("");
      setExactMatchChecked(false);
      setSessionFinished(false);
      setTallies({ Easy: 0, Normal: 0, Hard: 0, exactCorrect: 0 });
      setSessionStarted(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getDecks().then((list) => {
      setDecks(list);
      const deckId = list.some((d) => d.id === options.deckId)
        ? options.deckId
        : list[0]?.id || "";
      const next = { ...options, deckId };
      setOptions(next);
      if (searchParams.get("start") === "1" && deckId) startSession(next);
    });
    // Runs once on mount to resolve decks and honour the start=1 shortcut
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endSession = () => {
    setSessionStarted(false);
    setSessionFinished(false);
  };

  const mode = sessionOptions?.mode ?? options.mode;
  const currentCard = sessionCards[currentIndex];
  const showBackFirst = sessionOptions?.firstSide === "back";
  const promptText = currentCard
    ? showBackFirst
      ? currentCard.back
      : currentCard.front
    : "";
  const answerText = currentCard
    ? showBackFirst
      ? currentCard.front
      : currentCard.back
    : "";
  const revealed = isFlipped || exactMatchChecked;

  const handleCheckExactMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCard) return;
    setIsExactCorrect(typedAnswer.trim() === answerText.trim());
    setExactMatchChecked(true);
    setIsFlipped(true);
  };

  const handleRateCard = async (rating: DifficultyRating) => {
    if (!currentCard) return;

    // The API grades typed answers against the card's back. When the back is
    // the prompt, report the locally graded result in a form it understands.
    const submittedAnswer =
      mode !== "ExactMatch"
        ? undefined
        : showBackFirst
        ? isExactCorrect
          ? currentCard.back
          : ""
        : typedAnswer;

    const result = await api.submitReview({
      deckId: currentCard.deckId,
      cardId: currentCard.id,
      mode,
      rating,
      typedAnswer: submittedAnswer,
    });

    setTallies((prev) => ({
      ...prev,
      [rating]: prev[rating] + 1,
      exactCorrect:
        prev.exactCorrect + (mode === "ExactMatch" && result.isExactMatch ? 1 : 0),
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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Review"
        title="Review flashcards and setup review process."
      />

      {/* SETUP */}
      {!sessionStarted && (
        <div className="space-y-6">
          <ReviewOptionsForm
            options={options}
            decks={decks}
            onChange={setOptions}
            gridClassName="grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
          />
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                setOptions({ ...DEFAULT_REVIEW_OPTIONS, deckId: options.deckId })
              }
              className="tf-btn-danger px-8 py-3 text-lg"
            >
              Reset to default
            </button>
            <button
              type="button"
              onClick={() => startSession(options)}
              disabled={!options.deckId || loading}
              className="tf-btn-primary px-8 py-3 text-lg"
            >
              {loading ? "Loading…" : "Start Review"}
            </button>
          </div>
          <hr className="tf-divider" />
        </div>
      )}

      {/* ACTIVE SESSION */}
      {sessionStarted && !sessionFinished && (
        <>
          {sessionCards.length === 0 ? (
            <div className="mx-auto max-w-2xl space-y-4 rounded-2xl bg-tf-panel p-8 text-center">
              <p className="text-sm font-semibold text-tf-text">
                No cards matched your selected options in this deck.
              </p>
              <button
                type="button"
                onClick={endSession}
                className="tf-btn-primary"
              >
                Adjust review options
              </button>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-5 pt-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-tf-muted">
                  <span>
                    Card {currentIndex + 1} of {sessionCards.length}
                  </span>
                  <button
                    type="button"
                    onClick={endSession}
                    className="font-bold text-tf-sky hover:underline"
                  >
                    End session
                  </button>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-tf-panel">
                  <div
                    style={{
                      width: `${Math.round(
                        ((currentIndex + 1) / sessionCards.length) * 100
                      )}%`,
                    }}
                    className="h-full rounded-full bg-tf-sky transition-all"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={revealed || mode === "ExactMatch"}
                onClick={() => setIsFlipped(true)}
                aria-label={revealed ? "Card revealed" : "Reveal answer"}
                className="flex min-h-[260px] w-full flex-col items-center justify-center gap-5 rounded-xl border-2 border-tf-sky/80 bg-tf-tile px-8 py-8 text-center disabled:cursor-default"
              >
                <span className="w-full whitespace-pre-wrap break-words text-xl font-bold text-white sm:text-2xl">
                  {promptText}
                </span>
                {revealed && (
                  <>
                    <span className="h-0.5 w-4/5 rounded-full bg-white" />
                    <span className="w-full whitespace-pre-wrap break-words text-xl font-bold text-white sm:text-2xl">
                      {answerText}
                    </span>
                  </>
                )}
                {!revealed && mode === "Standard" && (
                  <span className="text-xs font-semibold text-tf-muted">
                    Click the card to reveal the answer
                  </span>
                )}
              </button>

              {mode === "ExactMatch" && !exactMatchChecked && (
                <form
                  onSubmit={handleCheckExactMatch}
                  className="flex flex-col gap-3 sm:flex-row"
                >
                  <input
                    type="text"
                    autoFocus
                    required
                    aria-label="Your answer"
                    placeholder="Type the exact answer…"
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    className="tf-input flex-1 py-3"
                  />
                  <button type="submit" className="tf-btn-primary px-8 py-3">
                    Check
                  </button>
                </form>
              )}

              {mode === "ExactMatch" && exactMatchChecked && (
                <div
                  className={`flex items-start gap-3 rounded-xl p-4 text-sm font-semibold ${
                    isExactCorrect
                      ? "bg-tf-mint/15 text-tf-mint"
                      : "bg-tf-rose/15 text-tf-rose"
                  }`}
                >
                  {isExactCorrect ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  )}
                  <div>
                    <p>
                      {isExactCorrect ? "Exact match!" : "Not an exact match."}
                    </p>
                    {!isExactCorrect && (
                      <p className="mt-1 font-normal text-tf-text">
                        You typed: <code className="font-bold">{typedAnswer}</code>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {revealed && (
                <div className="grid grid-cols-3 gap-3 sm:gap-5">
                  {RATINGS.map((r) => (
                    <button
                      key={r.rating}
                      type="button"
                      onClick={() => handleRateCard(r.rating)}
                      className={`rounded-xl py-4 text-lg font-bold text-white transition hover:brightness-110 sm:text-2xl ${r.className}`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* SESSION SUMMARY */}
      {sessionStarted && sessionFinished && (
        <div className="mx-auto max-w-2xl space-y-6 rounded-2xl bg-tf-panel p-8 text-center">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white">
              Review session complete!
            </h2>
            <p className="text-sm text-tf-muted">
              You reviewed {sessionCards.length}{" "}
              {sessionCards.length === 1 ? "card" : "cards"}.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[...RATINGS].reverse().map((r) => (
              <div key={r.rating} className={`rounded-xl py-3 text-white ${r.className}`}>
                <span className="text-sm font-bold">{r.label}</span>
                <p className="text-2xl font-bold">{tallies[r.rating]}</p>
              </div>
            ))}
          </div>

          {mode === "ExactMatch" && (
            <p className="text-sm font-bold text-tf-sky">
              Exact-match score: {tallies.exactCorrect} / {sessionCards.length} (
              {Math.round((tallies.exactCorrect / sessionCards.length) * 100)}%)
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => sessionOptions && startSession(sessionOptions)}
              className="tf-btn-primary px-6"
            >
              Review again
            </button>
            <button type="button" onClick={endSession} className="tf-btn-small px-6 py-2.5 text-sm">
              Change options
            </button>
            <Link href="/stats" className="tf-btn-small px-6 py-2.5 text-sm">
              View stats
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
        <div className="p-8 text-center text-sm text-tf-muted">Loading…</div>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}
