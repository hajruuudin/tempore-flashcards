import {
  DailyActivityPoint,
  DeckSummary,
  DifficultyRating,
  Flashcard,
  Folder,
  MonthlyActivityPoint,
  OverallStats,
  SubmitReviewPayload,
  SubmitReviewResult,
} from "@/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "/api";

// ============================================================================
// LOCAL STORAGE FALLBACK STORE (Enables instant offline PWA & standalone use)
// ============================================================================

interface LocalStore {
  folders: Folder[];
  decks: {
    id: string;
    name: string;
    description?: string | null;
    folderId?: string | null;
    createdAt: string;
    updatedAt: string;
    lastReviewedAt?: string | null;
  }[];
  cards: Flashcard[];
  reviewLogs: {
    id: string;
    deckId: string;
    cardId: string;
    mode: "Standard" | "ExactMatch";
    rating: DifficultyRating;
    typedAnswer?: string;
    isExactMatch?: boolean;
    reviewedAt: string;
  }[];
}

const STORAGE_KEY = "kumbhcards_local_store_v1";

function getInitialStore(): LocalStore {
  const now = new Date().toISOString();
  return {
    folders: [
      {
        id: "folder-1",
        name: "Computer Science & .NET",
        description: "Backend architecture, C#, and distributed systems",
        color: "wine-plum",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "folder-2",
        name: "Languages & Vocabulary",
        description: "Exact-match vocabulary and daily phrases",
        color: "almond-silk",
        createdAt: now,
        updatedAt: now,
      },
    ],
    decks: [
      {
        id: "deck-1",
        name: ".NET 8 & Cloud Architecture",
        description: "Core C# runtime, minimal APIs, and MongoDB patterns",
        folderId: "folder-1",
        createdAt: now,
        updatedAt: now,
        lastReviewedAt: now,
      },
      {
        id: "deck-2",
        name: "German Core Vocabulary",
        description: "High-frequency nouns & verbs for exact-match practice",
        folderId: "folder-2",
        createdAt: now,
        updatedAt: now,
        lastReviewedAt: now,
      },
    ],
    cards: [
      {
        id: "card-1",
        deckId: "deck-1",
        front: "Which C# interface represents an asynchronous stream of data?",
        back: "IAsyncEnumerable<T>",
        tags: ["csharp", "async", "dotnet"],
        reviewCount: 5,
        hardCount: 1,
        normalCount: 1,
        easyCount: 3,
        exactMatchCorrectCount: 2,
        exactMatchAttemptCount: 2,
        lastDifficulty: "Easy",
        createdAt: now,
        updatedAt: now,
        lastReviewedAt: now,
      },
      {
        id: "card-2",
        deckId: "deck-1",
        front: "What HTTP status code is returned when a new resource is created?",
        back: "201 Created",
        tags: ["http", "rest", "api"],
        reviewCount: 3,
        hardCount: 0,
        normalCount: 2,
        easyCount: 1,
        exactMatchCorrectCount: 1,
        exactMatchAttemptCount: 1,
        lastDifficulty: "Normal",
        createdAt: now,
        updatedAt: now,
        lastReviewedAt: now,
      },
      {
        id: "card-3",
        deckId: "deck-2",
        front: "Responsibility (in German)",
        back: "die Verantwortung",
        tags: ["german", "nouns", "b2"],
        reviewCount: 4,
        hardCount: 2,
        normalCount: 1,
        easyCount: 1,
        exactMatchCorrectCount: 1,
        exactMatchAttemptCount: 3,
        lastDifficulty: "Hard",
        createdAt: now,
        updatedAt: now,
        lastReviewedAt: now,
      },
    ],
    reviewLogs: [
      {
        id: "log-1",
        deckId: "deck-1",
        cardId: "card-1",
        mode: "Standard",
        rating: "Easy",
        reviewedAt: now,
      },
      {
        id: "log-2",
        deckId: "deck-2",
        cardId: "card-3",
        mode: "ExactMatch",
        rating: "Hard",
        typedAnswer: "Verantwortung",
        isExactMatch: false,
        reviewedAt: now,
      },
    ],
  };
}

function loadStore(): LocalStore {
  if (typeof window === "undefined") return getInitialStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init = getInitialStore();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
      return init;
    }
    return JSON.parse(raw) as LocalStore;
  } catch {
    return getInitialStore();
  }
}

function saveStore(store: LocalStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function isSameUtcDate(isoA: string, isoB: string): boolean {
  return isoA.slice(0, 10) === isoB.slice(0, 10);
}

function buildLocalDeckSummaries(
  store: LocalStore,
  folderId?: string
): DeckSummary[] {
  const todayIso = new Date().toISOString();
  const folderMap = new Map(store.folders.map((f) => [f.id, f.name]));

  return store.decks
    .filter((d) => !folderId || d.folderId === folderId)
    .map((d) => {
      const deckCards = store.cards.filter((c) => c.deckId === d.id);
      const hardCount = deckCards.reduce((acc, c) => acc + c.hardCount, 0);
      const normalCount = deckCards.reduce((acc, c) => acc + c.normalCount, 0);
      const easyCount = deckCards.reduce((acc, c) => acc + c.easyCount, 0);
      const totalReviews = deckCards.reduce((acc, c) => acc + c.reviewCount, 0);
      const mastered = deckCards.filter(
        (c) =>
          c.lastDifficulty === "Easy" ||
          (c.easyCount > c.hardCount && c.reviewCount > 0)
      ).length;

      return {
        id: d.id,
        name: d.name,
        description: d.description,
        folderId: d.folderId,
        folderName: d.folderId ? folderMap.get(d.folderId) || null : null,
        totalCards: deckCards.length,
        cardsAddedToday: deckCards.filter((c) =>
          isSameUtcDate(c.createdAt, todayIso)
        ).length,
        totalReviews,
        hardCount,
        normalCount,
        easyCount,
        masteryPercentage:
          deckCards.length > 0
            ? Math.round((mastered / deckCards.length) * 1000) / 10
            : 0,
        createdAt: d.createdAt,
        lastReviewedAt: d.lastReviewedAt,
      };
    });
}

// ============================================================================
// HYBRID FETCH HELPER (Calls .NET 8 Backend first; falls back to LocalStore)
// ============================================================================

async function tryApi<T>(
  path: string,
  options: RequestInit | undefined,
  fallbackFn: () => T
): Promise<T> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1800);
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (res.status === 204) return undefined as unknown as T;
    return (await res.json()) as T;
  } catch {
    return fallbackFn();
  }
}

export const api = {
  // FOLDERS
  getFolders: () =>
    tryApi<Folder[]>("/folders", undefined, () => loadStore().folders),

  createFolder: (payload: {
    name: string;
    description?: string;
    color?: string;
  }) =>
    tryApi<Folder>(
      "/folders",
      { method: "POST", body: JSON.stringify(payload) },
      () => {
        const store = loadStore();
        const now = new Date().toISOString();
        const folder: Folder = {
          id: `folder-${Date.now()}`,
          name: payload.name.trim(),
          description: payload.description?.trim() || null,
          color: payload.color || "wine-plum",
          createdAt: now,
          updatedAt: now,
        };
        store.folders.push(folder);
        saveStore(store);
        return folder;
      }
    ),

  deleteFolder: (id: string) =>
    tryApi<void>(`/folders/${id}`, { method: "DELETE" }, () => {
      const store = loadStore();
      store.folders = store.folders.filter((f) => f.id !== id);
      store.decks = store.decks.map((d) =>
        d.folderId === id ? { ...d, folderId: null } : d
      );
      saveStore(store);
    }),

  // DECKS
  getDecks: (folderId?: string) =>
    tryApi<DeckSummary[]>(
      `/decks${folderId ? `?folderId=${encodeURIComponent(folderId)}` : ""}`,
      undefined,
      () => buildLocalDeckSummaries(loadStore(), folderId)
    ),

  getDeck: (id: string) =>
    tryApi<DeckSummary | null>(`/decks/${id}`, undefined, () => {
      const list = buildLocalDeckSummaries(loadStore());
      return list.find((d) => d.id === id) || null;
    }),

  createDeck: (payload: {
    name: string;
    description?: string;
    folderId?: string | null;
  }) =>
    tryApi<DeckSummary>(
      "/decks",
      { method: "POST", body: JSON.stringify(payload) },
      () => {
        const store = loadStore();
        const now = new Date().toISOString();
        const newDeck = {
          id: `deck-${Date.now()}`,
          name: payload.name.trim(),
          description: payload.description?.trim() || null,
          folderId: payload.folderId || null,
          createdAt: now,
          updatedAt: now,
          lastReviewedAt: null,
        };
        store.decks.unshift(newDeck);
        saveStore(store);
        return buildLocalDeckSummaries(store).find(
          (d) => d.id === newDeck.id
        )!;
      }
    ),

  deleteDeck: (id: string) =>
    tryApi<void>(`/decks/${id}`, { method: "DELETE" }, () => {
      const store = loadStore();
      store.decks = store.decks.filter((d) => d.id !== id);
      store.cards = store.cards.filter((c) => c.deckId !== id);
      store.reviewLogs = store.reviewLogs.filter((l) => l.deckId !== id);
      saveStore(store);
    }),

  // CARDS
  getCards: (params?: { deckId?: string; search?: string; tag?: string }) => {
    const qs = new URLSearchParams();
    if (params?.deckId) qs.set("deckId", params.deckId);
    if (params?.search) qs.set("search", params.search);
    if (params?.tag) qs.set("tag", params.tag);
    const query = qs.toString() ? `?${qs.toString()}` : "";

    return tryApi<Flashcard[]>(`/cards${query}`, undefined, () => {
      const store = loadStore();
      return store.cards
        .filter((c) => {
          if (params?.deckId && c.deckId !== params.deckId) return false;
          if (params?.tag && !c.tags.includes(params.tag.toLowerCase()))
            return false;
          if (params?.search) {
            const q = params.search.toLowerCase().trim();
            const matchFront = c.front.toLowerCase().includes(q);
            const matchBack = c.back.toLowerCase().includes(q);
            const matchTag = c.tags.some((t) => t.toLowerCase().includes(q));
            if (!matchFront && !matchBack && !matchTag) return false;
          }
          return true;
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    });
  },

  createCard: (payload: {
    deckId: string;
    front: string;
    back: string;
    tags: string[];
  }) =>
    tryApi<Flashcard>(
      "/cards",
      { method: "POST", body: JSON.stringify(payload) },
      () => {
        const store = loadStore();
        const now = new Date().toISOString();
        const card: Flashcard = {
          id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          deckId: payload.deckId,
          front: payload.front.trim(),
          back: payload.back.trim(),
          tags: payload.tags
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean),
          reviewCount: 0,
          hardCount: 0,
          normalCount: 0,
          easyCount: 0,
          exactMatchCorrectCount: 0,
          exactMatchAttemptCount: 0,
          lastDifficulty: null,
          createdAt: now,
          updatedAt: now,
          lastReviewedAt: null,
        };
        store.cards.unshift(card);
        saveStore(store);
        return card;
      }
    ),

  updateCard: (
    id: string,
    payload: { front: string; back: string; tags: string[]; deckId?: string }
  ) =>
    tryApi<Flashcard>(
      `/cards/${id}`,
      { method: "PUT", body: JSON.stringify(payload) },
      () => {
        const store = loadStore();
        const idx = store.cards.findIndex((c) => c.id === id);
        if (idx === -1) throw new Error("Card not found");
        const updated: Flashcard = {
          ...store.cards[idx],
          front: payload.front.trim(),
          back: payload.back.trim(),
          tags: payload.tags
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean),
          deckId: payload.deckId || store.cards[idx].deckId,
          updatedAt: new Date().toISOString(),
        };
        store.cards[idx] = updated;
        saveStore(store);
        return updated;
      }
    ),

  deleteCard: (id: string) =>
    tryApi<void>(`/cards/${id}`, { method: "DELETE" }, () => {
      const store = loadStore();
      store.cards = store.cards.filter((c) => c.id !== id);
      saveStore(store);
    }),

  // REVIEWS
  getReviewSession: (params: {
    deckId: string;
    limit: number;
    order: string;
    difficultyFilter?: string;
  }) => {
    const qs = new URLSearchParams({
      deckId: params.deckId,
      limit: String(params.limit),
      order: params.order,
    });
    if (params.difficultyFilter)
      qs.set("difficultyFilter", params.difficultyFilter);

    return tryApi<Flashcard[]>(
      `/reviews/session?${qs.toString()}`,
      undefined,
      () => {
        const store = loadStore();
        let list = store.cards.filter((c) => c.deckId === params.deckId);

        if (params.difficultyFilter && params.difficultyFilter !== "All") {
          if (params.difficultyFilter === "Unreviewed") {
            list = list.filter((c) => c.reviewCount === 0);
          } else {
            list = list.filter(
              (c) => c.lastDifficulty === params.difficultyFilter
            );
          }
        }

        if (params.order === "oldest") {
          list.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        } else if (params.order === "newest") {
          list.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        } else if (params.order === "hardest") {
          list.sort((a, b) => b.hardCount - a.hardCount);
        } else {
          list = [...list].sort(() => Math.random() - 0.5);
        }

        return params.limit > 0 ? list.slice(0, params.limit) : list;
      }
    );
  },

  submitReview: (payload: SubmitReviewPayload) =>
    tryApi<SubmitReviewResult>(
      "/reviews/submit",
      { method: "POST", body: JSON.stringify(payload) },
      () => {
        const store = loadStore();
        const idx = store.cards.findIndex((c) => c.id === payload.cardId);
        if (idx === -1) throw new Error("Card not found");
        const card = store.cards[idx];
        const now = new Date().toISOString();

        const isExactMatch =
          payload.mode === "ExactMatch"
            ? (payload.typedAnswer ?? "").trim() === card.back.trim()
            : false;

        const rating: DifficultyRating = payload.rating;

        const updated: Flashcard = {
          ...card,
          reviewCount: card.reviewCount + 1,
          hardCount: card.hardCount + (rating === "Hard" ? 1 : 0),
          normalCount: card.normalCount + (rating === "Normal" ? 1 : 0),
          easyCount: card.easyCount + (rating === "Easy" ? 1 : 0),
          exactMatchAttemptCount:
            card.exactMatchAttemptCount +
            (payload.mode === "ExactMatch" ? 1 : 0),
          exactMatchCorrectCount:
            card.exactMatchCorrectCount +
            (payload.mode === "ExactMatch" && isExactMatch ? 1 : 0),
          lastDifficulty: rating,
          lastReviewedAt: now,
          updatedAt: now,
        };

        store.cards[idx] = updated;
        store.reviewLogs.push({
          id: `log-${Date.now()}`,
          deckId: card.deckId,
          cardId: card.id,
          mode: payload.mode,
          rating,
          typedAnswer: payload.typedAnswer,
          isExactMatch:
            payload.mode === "ExactMatch" ? isExactMatch : undefined,
          reviewedAt: now,
        });

        const deckIdx = store.decks.findIndex((d) => d.id === card.deckId);
        if (deckIdx !== -1) {
          store.decks[deckIdx].lastReviewedAt = now;
          store.decks[deckIdx].updatedAt = now;
        }

        saveStore(store);
        return { card: updated, isExactMatch };
      }
    ),

  // STATS
  getOverallStats: () =>
    tryApi<OverallStats>("/stats/overall", undefined, () => {
      const store = loadStore();
      const todayIso = new Date().toISOString();
      const deckBreakdown = buildLocalDeckSummaries(store);

      const days: DailyActivityPoint[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayLogs = store.reviewLogs.filter(
          (l) => l.reviewedAt.slice(0, 10) === dateStr
        );
        days.push({
          date: dateStr,
          reviewsCount: dayLogs.length,
          cardsAddedCount: store.cards.filter(
            (c) => c.createdAt.slice(0, 10) === dateStr
          ).length,
          hardCount: dayLogs.filter((l) => l.rating === "Hard").length,
          normalCount: dayLogs.filter((l) => l.rating === "Normal").length,
          easyCount: dayLogs.filter((l) => l.rating === "Easy").length,
        });
      }

      const months: MonthlyActivityPoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        const monthStr = d.toISOString().slice(0, 7);
        months.push({
          month: monthStr,
          reviewsCount: store.reviewLogs.filter(
            (l) => l.reviewedAt.slice(0, 7) === monthStr
          ).length,
          cardsAddedCount: store.cards.filter(
            (c) => c.createdAt.slice(0, 7) === monthStr
          ).length,
        });
      }

      const exactAttempts = store.cards.reduce(
        (acc, c) => acc + c.exactMatchAttemptCount,
        0
      );
      const exactCorrect = store.cards.reduce(
        (acc, c) => acc + c.exactMatchCorrectCount,
        0
      );

      return {
        totalFolders: store.folders.length,
        totalDecks: store.decks.length,
        totalCards: store.cards.length,
        cardsAddedToday: store.cards.filter((c) =>
          isSameUtcDate(c.createdAt, todayIso)
        ).length,
        totalReviews: store.cards.reduce((acc, c) => acc + c.reviewCount, 0),
        reviewsToday: store.reviewLogs.filter((l) =>
          isSameUtcDate(l.reviewedAt, todayIso)
        ).length,
        hardTotal: store.cards.reduce((acc, c) => acc + c.hardCount, 0),
        normalTotal: store.cards.reduce((acc, c) => acc + c.normalCount, 0),
        easyTotal: store.cards.reduce((acc, c) => acc + c.easyCount, 0),
        exactMatchAccuracy:
          exactAttempts > 0
            ? Math.round((exactCorrect / exactAttempts) * 1000) / 10
            : 0,
        last7DaysActivity: days,
        last6MonthsActivity: months,
        deckBreakdown,
      };
    }),

  // CSV EXPORT & IMPORT HELPERS
  exportDeckCsv: async (deckId: string, deckName: string) => {
    const cards = await api.getCards({ deckId });
    const escapeCsv = (val: string) =>
      `"${(val || "").replace(/"/g, '""')}"`;
    const header = "Front,Back,Tags\n";
    const rows = cards
      .map(
        (c) =>
          `${escapeCsv(c.front)},${escapeCsv(c.back)},${escapeCsv(
            c.tags.join(";")
          )}`
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${deckName.replace(/\s+/g, "_").toLowerCase()}_cards.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  importDeckCsv: async (deckId: string, csvText: string): Promise<number> => {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return 0;

    // Parse CSV lines (supporting quoted fields)
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
      result.push(current.trim());
      return result;
    };

    let startIndex = 0;
    const firstRow = parseLine(lines[0]).map((h) => h.toLowerCase());
    if (firstRow.includes("front") && firstRow.includes("back")) {
      startIndex = 1;
    }

    let imported = 0;
    for (let i = startIndex; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      if (cols.length < 2) continue;
      const [front, back, rawTags] = cols;
      if (!front || !back) continue;
      const tags = (rawTags || "")
        .split(/[;,]/)
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      await api.createCard({ deckId, front, back, tags });
      imported++;
    }
    return imported;
  },
};
