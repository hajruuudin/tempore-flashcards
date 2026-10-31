# Flashcards PWA - Monorepo (.NET 8 + Next.js + MongoDB)

A minimal, responsive **Progressive Web Application (PWA)** for creating, organizing, importing/exporting, and reviewing flashcards with comprehensive statistics. Designed with the custom **Silver, Bone, Almond Silk, Smoky Rose, and Wine Plum** palette and **Kumbh Sans** typography.

## Repository Structure

```text
flashcards-pwa/
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # GitHub Actions CI/CD pipeline (build, test, Docker push)
├── db/
│   ├── schema.json               # Formal JSON Schema definitions for MongoDB collections
│   ├── init-mongo.js             # MongoDB initialization script (collections, validators, indexes, seed data)
│   └── README.md                 # Database schema documentation
├── backend/
│   ├── Flashcards.Api.csproj     # .NET 8 Web API project file (MongoDB.Driver, CsvHelper, Swashbuckle)
│   ├── Program.cs                # API startup, DI, CORS, and Swagger configuration
│   ├── appsettings.json          # MongoDB connection settings
│   ├── Dockerfile                # Multi-stage production Dockerfile for .NET 8 API
│   ├── Models/
│   │   ├── Entities.cs           # Folder, Deck, Flashcard, and ReviewLog MongoDB models
│   │   └── Dtos.cs               # Request/Response DTOs, Review options, and Stats payloads
│   ├── Services/
│   │   └── FlashcardService.cs   # Core business logic, CRUD, search, stats, and CSV import/export
│   └── Controllers/
│       ├── FoldersController.cs  # Folder CRUD endpoints
│       ├── DecksController.cs    # Deck CRUD + CSV Import/Export endpoints
│       ├── CardsController.cs    # Flashcard CRUD + Live duplicate search endpoints
│       ├── ReviewsController.cs  # Review session generation & Hard/Normal/Easy + Exact Match logging
│       └── StatsController.cs    # Overall and per-deck statistical overview endpoints
├── frontend/
│   ├── package.json              # Next.js 14, React 18, Tailwind CSS, Lucide Icons
│   ├── tsconfig.json             # TypeScript configuration
│   ├── next.config.mjs           # Next.js configuration (standalone output for Docker)
│   ├── tailwind.config.ts        # Custom color palette (silver, bone, almond-silk, smoky-rose, wine-plum) & Kumbh Sans
│   ├── postcss.config.js         # PostCSS configuration
│   ├── Dockerfile                # Multi-stage production Dockerfile for Next.js
│   ├── public/
│   │   ├── manifest.json         # PWA Web App Manifest (installable on iOS/Android)
│   │   └── sw.js                 # Service Worker for offline caching & PWA compliance
│   └── src/
│       ├── types/
│       │   └── index.ts          # Shared TypeScript interfaces matching .NET DTOs
│       ├── lib/
│       │   └── api.ts            # Hybrid API client (connects to .NET API with automatic local fallback)
│       ├── components/
│       │   └── Navbar.tsx        # Top navigation bar (Logo left, navigation right)
│       └── app/
│           ├── globals.css       # Kumbh Sans import & base minimal styling
│           ├── layout.tsx        # Root PWA layout, metadata, and 60% centered desktop container
│           ├── page.tsx          # Homescreen (Welcome + 3 Widget Blocks: Actions, Stats, Folders/Decks)
│           ├── add-card/
│           │   └── page.tsx      # Add Card screen (Live duplicate search, Date added, Today's deck count)
│           ├── decks/
│           │   └── [id]/
│           │       └── page.tsx  # Deck Cards View (Search, tag filter, edit/delete, CSV Import & Export)
│           ├── review/
│           │   └── page.tsx      # Review Mode (Configurable count/order/random, Standard Flip & Exact-Match Write Mode)
│           └── stats/
│               └── page.tsx      # Dedicated Statistics screen (Overall graphical overview + Per-deck stats)
└── docker-compose.yml            # Full-stack orchestration (MongoDB + .NET API + Next.js Frontend)
```

---

## Quick Start

### Option 1: Run Everything with Docker Compose (Recommended for Cloud & Local)

```bash
docker compose up --build
```

- **Frontend (Next.js PWA):** `http://localhost:3000`
- **Backend (.NET 8 Swagger UI):** `http://localhost:5000/swagger`
- **MongoDB:** `mongodb://localhost:27017` (initialized automatically via `db/init-mongo.js`)

### Option 2: Run Services Individually for Development

1. **Database (MongoDB):**
   Start a local MongoDB instance on `mongodb://localhost:27017` and run:
   ```bash
   mongosh flashcards_db db/init-mongo.js
   ```

2. **Backend (.NET 8 C#):**
   ```bash
   cd backend
   dotnet restore
   dotnet run
   ```

3. **Frontend (Next.js):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Note: The frontend includes a built-in hybrid state layer in `src/lib/api.ts` so you can also test and use the UI immediately in standalone mode even before the .NET API is reachable.*

---

## Installing as an iOS / Mobile PWA

1. Deploy or serve the application over HTTPS (or access via local network in Safari on iOS).
2. Open the web app in **Safari** on your iPhone.
3. Tap the **Share** button at the bottom of the screen.
4. Select **Add to Home Screen**.
5. The app launches in standalone full-screen mode (`display: standalone`) using the custom `bone` and `wine-plum` theme colors.
