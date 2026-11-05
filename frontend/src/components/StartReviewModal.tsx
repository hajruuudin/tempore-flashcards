"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import ReviewOptionsForm from "@/components/ReviewOptionsForm";
import {
  DEFAULT_REVIEW_OPTIONS,
  ReviewOptions,
  reviewOptionsToQuery,
} from "@/lib/review";
import { DeckSummary } from "@/types";

interface StartReviewModalProps {
  decks: DeckSummary[];
  defaultDeckId?: string;
  onClose: () => void;
}

export default function StartReviewModal({
  decks,
  defaultDeckId,
  onClose,
}: StartReviewModalProps) {
  const router = useRouter();
  const [options, setOptions] = useState<ReviewOptions>({
    ...DEFAULT_REVIEW_OPTIONS,
    deckId: defaultDeckId || decks[0]?.id || "",
  });

  const handleStart = () => {
    if (!options.deckId) return;
    router.push(`/review?${reviewOptionsToQuery(options)}&start=1`);
  };

  return (
    <Modal title="Start Review" onClose={onClose}>
      <ReviewOptionsForm options={options} decks={decks} onChange={setOptions} />
      <div className="flex justify-center gap-2 pt-8">
        <button
          type="button"
          onClick={onClose}
          className="tf-btn-danger w-full max-w-[280px] py-4 text-xl"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleStart}
          disabled={!options.deckId}
          className="tf-btn-primary w-full max-w-[280px] py-4 text-xl"
        >
          Start Review
        </button>
      </div>
    </Modal>
  );
}
