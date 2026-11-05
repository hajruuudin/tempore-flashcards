"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { api } from "@/lib/api";
import { DeckSummary, Folder } from "@/types";

interface NewDeckModalProps {
  onClose: () => void;
  onCreated: (deck: DeckSummary) => void;
}

export default function NewDeckModal({ onClose, onCreated }: NewDeckModalProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [folderId, setFolderId] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getFolders().then(setFolders).catch(() => setFolders([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      let targetFolderId: string | null = folderId || null;
      if (newFolderName.trim()) {
        const folder = await api.createFolder({
          name: newFolderName,
          color: "tf",
        });
        targetFolderId = folder.id;
      }
      const deck = await api.createDeck({
        name,
        description,
        folderId: targetFolderId,
      });
      onCreated(deck);
      onClose();
    } catch {
      setError("Could not create the deck. Please try again.");
      setSaving(false);
    }
  };

  return (
    <Modal title="Add New Deck" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          required
          autoFocus
          aria-label="Deck name"
          placeholder="Deck name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="tf-input"
        />
        <input
          type="text"
          aria-label="Description"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="tf-input"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr]">
          <select
            aria-label="Folder"
            value={folderId}
            disabled={!!newFolderName.trim()}
            onChange={(e) => setFolderId(e.target.value)}
            className="tf-input cursor-pointer disabled:opacity-50 [&>option]:bg-tf-panel"
          >
            <option value="">Folder</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            aria-label="Create new folder"
            placeholder="Create new folder"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="tf-input"
          />
        </div>

        {error && (
          <p className="text-center text-sm font-semibold text-tf-rose">
            {error}
          </p>
        )}

        <div className="flex justify-center gap-2 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="tf-btn-danger w-full max-w-[280px] py-4 text-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="tf-btn-primary w-full max-w-[280px] py-4 text-xl"
          >
            Add Deck
          </button>
        </div>
      </form>
    </Modal>
  );
}
