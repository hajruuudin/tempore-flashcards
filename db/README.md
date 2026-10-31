# MongoDB Database Schema (`/db`)

The application uses **MongoDB** (`flashcards_db`) with 4 primary collections:

1. **`folders`**: Groups decks into logical categories (`_id`, `name`, `description`, `color`, `createdAt`, `updatedAt`).
2. **`decks`**: Represents a collection of flashcards (`_id`, `name`, `description`, `folderId`, `createdAt`, `updatedAt`, `lastReviewedAt`).
3. **`cards`**: Stores front/back flashcards with tags and per-card review counters (`_id`, `deckId`, `front`, `back`, `tags`, `reviewCount`, `hardCount`, `normalCount`, `easyCount`, `exactMatchCorrectCount`, `exactMatchAttemptCount`, `lastDifficulty`, `createdAt`, `updatedAt`, `lastReviewedAt`).
   - Compound index `{ deckId: 1, createdAt: -1 }` powers fast per-deck card listing and "Cards Added Today" metrics.
   - Text index `{ deckId: 1, front: "text", back: "text", tags: "text" }` powers real-time duplicate checking when adding new cards.
4. **`review_logs`**: Immutable time-series log of every card review (`_id`, `deckId`, `cardId`, `mode`, `rating`, `typedAnswer`, `isExactMatch`, `durationMs`, `reviewedAt`).
   - Used to compute daily activity streaks, 7-day review charts, difficulty distributions (`Hard` / `Normal` / `Easy`), and `ExactMatch` accuracy both globally and per individual deck.
