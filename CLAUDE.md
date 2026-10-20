# TemporeFlashcards

| | |
|---|---|
| **Application name** | TemporeFlashcards |
| **Platform** | iPhone (iOS) and Mac (macOS) clients, self-hosted backend and database |
| **Type** | Full-stack application with a deployed datasource |
| **Design** | Minimalistic, modern, simple functions (visual design spec to be provided later) |

## 1. Purpose

TemporeFlashcards is a simple flashcards application. Its primary focus is letting users:

1. Quickly add flashcards to their own custom decks.
2. Organise decks (folders, favourites).
3. Do unlimited reviews on both iPhone and Mac.
4. Connect to **their own self-hosted instance** (backend + database), so they own their data.

It also provides the useful features that paywalled flashcard apps lock away, so students do not have to pay for them. Cost-free access to core features is a guiding principle: never design a feature as "premium" or gated.

**Target audience for v1:** users already comfortable with self-hosted applications (deploying a backend and a MongoDB instance). A publicly available, hosted version is planned for later and is out of scope for v1, but v1 decisions should not make it impossible (e.g. avoid hard-coding a single global backend URL; keep user/data ownership boundaries clean).

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | **React Native**, one codebase producing both the **iOS** bundle and the **macOS** bundle | macOS support via `react-native-macos` (or equivalent). Prefer shared code; isolate platform-specific code behind small adapters. |
| Frontend styling | **Tailwind** coupled with React (React Native-compatible binding, e.g. NativeWind) | Dedicated styling framework is mandatory; no ad-hoc inline style systems. |
| Backend | **.NET with C#**, hosted on an online instance | Also ships a `docker-compose.yml` so the backend can be imaged identically anywhere. |
| Database | **MongoDB**, deployed on an online instance | Document database; "tables" in this file mean MongoDB collections. |
| ORM | An ORM within .NET (e.g. the EF Core MongoDB provider) | Collections/entities are defined and created through the ORM, not by hand. |

## 3. Main Features

### 3.1 Datasource onboarding (first-launch screen)
- On first launch the app shows a setup screen instructing the user to add a **valid datasource with credentials** (their self-hosted backend / MongoDB instance).
- The credentials are used so the **database structure (collections, indexes) is created correctly** on the user's instance, via the backend's versioned migrations (see section 5).
- The connection must be validated before the user can proceed (reachable, authenticated, schema initialised or up to date). Show clear, actionable errors on failure.
- Credentials are stored securely on-device (Keychain on iOS/macOS), never in plain text or in the repo.
- The datasource can be changed later from settings.

### 3.2 Flashcards (CRUD)
- A flashcard has a **front** and a **back**, plus optional **tags**.
- Full create / read / update / delete.
- Adding a card must be fast: minimal fields, keyboard-friendly on Mac, quick-add on iPhone.

### 3.3 Decks
- A deck is a named collection of flashcards; decks can be created, renamed/edited, and deleted.
- Decks can be sorted into **folders** for organisation.
- Decks can be marked as **favourite**; favourite decks appear on the user's **home screen**.

### 3.4 Review mode
- Review is done per individual deck, with unlimited reviews (no daily caps or paywalls).
- Provides per-deck statistics and features comparable to those offered by **AnkiApp** (e.g. flip card, rate recall difficulty, spaced-repetition scheduling, session progress/summary). The exact AnkiApp feature list is to be confirmed with the user before implementation; do not guess beyond this list without asking.
- Every answered card produces a review record that feeds the statistics (section 3.5).

### 3.5 Statistics
- Overall user-profile statistics over the **last calendar year**: reviews per day (heatmap/graph style), most falsely answered cards, and similar insights.
- Statistics are kept in a **separate database** from the main flashcard data, to be treated as its own module with its own data access.

### 3.6 CSV export
- Export an entire deck to a `.csv` file with exactly three columns, in this order: `front`, `back`, `tags`.
- `tags` is a single column with comma-separated values; the CSV writer must correctly quote/escape fields containing commas, quotes, or newlines.

### 3.7 CSV import
- Import a deck from a `.csv` file in the **same format as the export** (`front`, `back`, `tags`).
- Importing an exported file must round-trip losslessly. Validate input and report row-level errors rather than failing silently.

### 3.8 UI
- Overall minimalistic UI. The detailed design/instructions will be provided to the agent later; until then do not invent a visual identity beyond Tailwind defaults and neutral, minimal layouts.

## 4. Architecture Requirements

1. **Use the stack above**, together with dedicated styling frameworks (Tailwind).
2. **Separated modules with layered architecture inside each module** (backend):
   - **DAO** (data access): the only layer that talks to the database.
   - **Service**: business logic; depends on DAO, never on REST.
   - **REST**: HTTP controllers/endpoints; depends on Service, contains no business logic.
   - **Database models** represent the entities and are what the upper layers use to represent them. Do not leak persistence concerns into REST contracts beyond what is deliberate (use DTOs where models should not be exposed).
   - Likely modules: Datasource/Setup, Flashcards, Decks (incl. folders), Review, Statistics, Import/Export. Each module follows the same DAO / Service / REST structure.
3. **Frontend and backend are strictly separated.** The FE implementation is independent of the BE table definitions: the FE talks to the BE only through the REST API; entity/table definitions live exclusively in the backend.
4. **Backend tables are created using the ORM within .NET** (code-first), not by manual scripts.
5. **Database migrations use dedicated versioning**: every schema change is a new, ordered, versioned migration that can be applied to an existing instance. Never edit an already-released migration.
6. Backend must run identically locally and online via the provided `docker-compose.yml`.

## 5. Notes, Assumptions and Open Questions

These are things to resolve with the user rather than silently decide.

- **README conflict:** `README.md` currently describes a **Supabase** backend with real-time sync. This contradicts the stack in this file (.NET + MongoDB). This file is authoritative; the README should be updated to match once confirmed.
- **Migrations on MongoDB:** the standard EF Core migrations tooling targets relational databases and does not apply to the MongoDB provider. A dedicated, versioned migration mechanism (e.g. an ordered migration runner with a migrations-history collection, or a purpose-built library) will be needed to satisfy requirement 4.5. Confirm the approach before implementing.
- **Separate statistics database:** confirm whether this means a separate MongoDB database on the same instance, or a separate instance. Default assumption: separate database, same instance and credentials.
- **Authentication:** not specified. v1 is single-user per self-hosted instance; whether the API needs its own auth (e.g. API key/token) beyond the database credentials is to be decided.
- **Scheduling algorithm:** not specified. A well-known spaced-repetition algorithm (e.g. SM-2) is a reasonable default, to be confirmed along with the AnkiApp feature list.
- **Offline behaviour:** not specified. Assume online-only against the user's backend for v1 unless told otherwise.
- **Design:** the visual design and UI instructions are missing and will be supplied later.

## 6. Working Agreements for Claude

- Treat this file as the source of truth for requirements. If a request conflicts with it, point out the conflict before proceeding.
- Keep the app minimal: do not add features beyond those listed without asking.
- Follow the layered module structure for every backend feature; do not skip layers.
- Update this file whenever requirements, stack decisions, or the design spec change.
