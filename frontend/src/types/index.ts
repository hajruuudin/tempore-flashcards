export type DifficultyRating = "Hard" | "Normal" | "Easy";
export type ReviewModeType = "Standard" | "ExactMatch";

export interface Folder {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeckSummary {
  id: string;
  name: string;
  description?: string | null;
  folderId?: string | null;
  folderName?: string | null;
  totalCards: number;
  cardsAddedToday: number;
  totalReviews: number;
  hardCount: number;
  normalCount: number;
  easyCount: number;
  masteryPercentage: number;
  createdAt: string;
  lastReviewedAt?: string | null;
}

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  tags: string[];
  reviewCount: number;
  hardCount: number;
  normalCount: number;
  easyCount: number;
  exactMatchCorrectCount: number;
  exactMatchAttemptCount: number;
  lastDifficulty?: DifficultyRating | null;
  createdAt: string;
  updatedAt: string;
  lastReviewedAt?: string | null;
}

export interface DailyActivityPoint {
  date: string;
  reviewsCount: number;
  cardsAddedCount: number;
}

export interface OverallStats {
  totalDecks: number;
  totalFolders: number;
  totalCards: number;
  cardsAddedToday: number;
  totalReviews: number;
  reviewsToday: number;
  hardTotal: number;
  normalTotal: number;
  easyTotal: number;
  exactMatchAccuracy: number;
  last7DaysActivity: DailyActivityPoint[];
  deckBreakdown: DeckSummary[];
}

export interface SubmitReviewPayload {
  deckId: string;
  cardId: string;
  mode: ReviewModeType;
  rating: DifficultyRating;
  typedAnswer?: string;
  durationMs?: number;
}

export interface SubmitReviewResult {
  card: Flashcard;
  isExactMatch: boolean;
}
