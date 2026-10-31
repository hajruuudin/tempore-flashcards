// MongoDB Initialization Script for Flashcards PWA
// Executed automatically by the official Mongo Docker image on first startup

db = db.getSiblingDB('flashcards_db');

// 1. Folders Collection
db.createCollection('folders', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'createdAt', 'updatedAt'],
      properties: {
        name: { bsonType: 'string', description: 'Folder name is required' },
        description: { bsonType: ['string', 'null'] },
        color: { bsonType: ['string', 'null'] },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' }
      }
    }
  }
});
db.folders.createIndex({ name: 1 }, { unique: false });

// 2. Decks Collection
db.createCollection('decks', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'createdAt', 'updatedAt'],
      properties: {
        name: { bsonType: 'string', description: 'Deck name is required' },
        description: { bsonType: ['string', 'null'] },
        folderId: { bsonType: ['objectId', 'string', 'null'] },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' },
        lastReviewedAt: { bsonType: ['date', 'null'] }
      }
    }
  }
});
db.decks.createIndex({ folderId: 1 });
db.decks.createIndex({ name: 1 });

// 3. Cards Collection
db.createCollection('cards', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['deckId', 'front', 'back', 'tags', 'createdAt', 'updatedAt'],
      properties: {
        deckId: { bsonType: ['objectId', 'string'] },
        front: { bsonType: 'string' },
        back: { bsonType: 'string' },
        tags: { bsonType: 'array', items: { bsonType: 'string' } },
        reviewCount: { bsonType: 'int' },
        hardCount: { bsonType: 'int' },
        normalCount: { bsonType: 'int' },
        easyCount: { bsonType: 'int' },
        exactMatchCorrectCount: { bsonType: 'int' },
        exactMatchAttemptCount: { bsonType: 'int' },
        lastDifficulty: { bsonType: ['string', 'null'] },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' },
        lastReviewedAt: { bsonType: ['date', 'null'] }
      }
    }
  }
});
db.cards.createIndex({ deckId: 1, createdAt: -1 });
db.cards.createIndex({ deckId: 1, front: 'text', back: 'text', tags: 'text' });

// 4. Review Logs Collection
db.createCollection('review_logs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['deckId', 'cardId', 'mode', 'rating', 'reviewedAt'],
      properties: {
        deckId: { bsonType: ['objectId', 'string'] },
        cardId: { bsonType: ['objectId', 'string'] },
        mode: { bsonType: 'string', enum: ['Standard', 'ExactMatch'] },
        rating: { bsonType: 'string', enum: ['Hard', 'Normal', 'Easy'] },
        typedAnswer: { bsonType: ['string', 'null'] },
        isExactMatch: { bsonType: ['bool', 'null'] },
        durationMs: { bsonType: 'int' },
        reviewedAt: { bsonType: 'date' }
      }
    }
  }
});
db.review_logs.createIndex({ deckId: 1, reviewedAt: -1 });
db.review_logs.createIndex({ reviewedAt: -1 });

// Seed initial sample data so the first deployment is immediately usable
const now = new Date();
const folder1Id = ObjectId();
const folder2Id = ObjectId();

db.folders.insertMany([
  {
    _id: folder1Id,
    name: 'Computer Science & Cloud',
    description: 'Core engineering, distributed systems, and .NET concepts',
    color: 'wine-plum',
    createdAt: now,
    updatedAt: now
  },
  {
    _id: folder2Id,
    name: 'Languages & Vocabulary',
    description: 'Daily vocabulary practice and exact-match spelling',
    color: 'almond-silk',
    createdAt: now,
    updatedAt: now
  }
]);

const deck1Id = ObjectId();
const deck2Id = ObjectId();

db.decks.insertMany([
  {
    _id: deck1Id,
    name: '.NET & System Architecture',
    description: 'Essential C#, CLR, and cloud-native patterns',
    folderId: folder1Id,
    createdAt: now,
    updatedAt: now,
    lastReviewedAt: now
  },
  {
    _id: deck2Id,
    name: 'German Core Vocabulary',
    description: 'High-frequency nouns and verbs for exact-match review',
    folderId: folder2Id,
    createdAt: now,
    updatedAt: now,
    lastReviewedAt: null
  }
]);

db.cards.insertMany([
  {
    deckId: deck1Id,
    front: 'What interfaces define asynchronous streams in C# 8+?',
    back: 'IAsyncEnumerable<T> and IAsyncEnumerator<T>',
    tags: ['csharp', 'async', 'dotnet'],
    reviewCount: 4,
    hardCount: 1,
    normalCount: 1,
    easyCount: 2,
    exactMatchCorrectCount: 2,
    exactMatchAttemptCount: 2,
    lastDifficulty: 'Easy',
    createdAt: now,
    updatedAt: now,
    lastReviewedAt: now
  },
  {
    deckId: deck1Id,
    front: 'Which HTTP status code indicates that a resource was successfully created?',
    back: '201 Created',
    tags: ['http', 'rest', 'api'],
    reviewCount: 3,
    hardCount: 0,
    normalCount: 2,
    easyCount: 1,
    exactMatchCorrectCount: 1,
    exactMatchAttemptCount: 1,
    lastDifficulty: 'Normal',
    createdAt: now,
    updatedAt: now,
    lastReviewedAt: now
  },
  {
    deckId: deck2Id,
    front: 'Responsibility (in German)',
    back: 'die Verantwortung',
    tags: ['nouns', 'b2'],
    reviewCount: 2,
    hardCount: 1,
    normalCount: 1,
    easyCount: 0,
    exactMatchCorrectCount: 1,
    exactMatchAttemptCount: 2,
    lastDifficulty: 'Hard',
    createdAt: now,
    updatedAt: now,
    lastReviewedAt: now
  }
]);
