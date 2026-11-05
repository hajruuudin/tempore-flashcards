"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import Modal from "@/components/Modal";
import { api } from "@/lib/api";
import { DeckSummary } from "@/types";

interface QuickAddCardModalProps {
  decks: DeckSummary[];
  defaultDeckId?: string;
  onClose: () => void;
  onAdded: () => void;
}

export default function QuickAddCardModal({
  decks,
  defaultDeckId,
  onClose,
  onAdded,
}: QuickAddCardModalProps) {
  const [deckId, setDeckId] = useState(defaultDeckId || decks[0]?.id || "");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [addedInSession, setAddedInSession] = useState<Record<string, number>>(
    {}
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const deck = decks.find((d) => d.id === deckId);
  const addedToday = (deck?.cardsAddedToday ?? 0) + (addedInSession[deckId] ?? 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckId || !front.trim() || !back.trim() || saving) return;
    setSaving(true);
    try {
      await api.createCard({ deckId, front, back, tags: [] });
      setAddedInSession((prev) => ({ ...prev, [deckId]: (prev[deckId] ?? 0) + 1 }));
      setFront("");
      setBack("");
      setMessage("Card added!");
      onAdded();
    } catch {
      setMessage("Could not add the card.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add New Card" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
          <select
            aria-label="Select deck"
            value={deckId}
            onChange={(e) => {
              setDeckId(e.target.value);
              setMessage(null);
            }}
            className="tf-input cursor-pointer [&>option]:bg-tf-panel"
          >
            {decks.length === 0 && <option value="">No decks yet</option>}
            {decks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <div className="tf-tile flex min-w-[180px] flex-col items-center justify-center px-5 py-2">
            <span className="text-3xl font-bold leading-tight text-white">
              {addedToday}
            </span>
            <span className="text-sm font-bold text-white">Card added today</span>
          </div>
        </div>

        <textarea
          required
          rows={3}
          aria-label="Front"
          placeholder="Front"
          value={front}
          onChange={(e) => setFront(e.target.value)}
          className="tf-input resize-none"
        />
        <textarea
          required
          rows={3}
          aria-label="Back"
          placeholder="Back"
          value={back}
          onChange={(e) => setBack(e.target.value)}
          className="tf-input resize-none"
        />

        <div className="h-5 text-center text-sm font-semibold text-tf-mint" aria-live="polite">
          {message && (
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              {message}
            </span>
          )}
        </div>

        <div className="flex justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="tf-btn-danger w-full max-w-[280px] py-4 text-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !deckId}
            className="tf-btn-primary w-full max-w-[280px] py-4 text-xl"
          >
            Add Card
          </button>
        </div>
      </form>
    </Modal>
  );
}
