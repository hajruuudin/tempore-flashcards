using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Flashcards.Api.Models;

public class MongoDbSettings
{
    public string ConnectionString { get; set; } = "mongodb://localhost:27017";
    public string DatabaseName { get; set; } = "flashcards_db";
}

public class Folder
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("description")]
    public string? Description { get; set; }

    [BsonElement("color")]
    public string Color { get; set; } = "wine-plum";

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class Deck
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("name")]
    public string Name { get; set; } = string.Empty;

    [BsonElement("description")]
    public string? Description { get; set; }

    [BsonElement("folderId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? FolderId { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("lastReviewedAt")]
    public DateTime? LastReviewedAt { get; set; }
}

public class Flashcard
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("deckId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string DeckId { get; set; } = string.Empty;

    [BsonElement("front")]
    public string Front { get; set; } = string.Empty;

    [BsonElement("back")]
    public string Back { get; set; } = string.Empty;

    [BsonElement("tags")]
    public List<string> Tags { get; set; } = new();

    [BsonElement("reviewCount")]
    public int ReviewCount { get; set; }

    [BsonElement("hardCount")]
    public int HardCount { get; set; }

    [BsonElement("normalCount")]
    public int NormalCount { get; set; }

    [BsonElement("easyCount")]
    public int EasyCount { get; set; }

    [BsonElement("exactMatchCorrectCount")]
    public int ExactMatchCorrectCount { get; set; }

    [BsonElement("exactMatchAttemptCount")]
    public int ExactMatchAttemptCount { get; set; }

    [BsonElement("lastDifficulty")]
    public string? LastDifficulty { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("lastReviewedAt")]
    public DateTime? LastReviewedAt { get; set; }
}

public class ReviewLog
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("deckId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string DeckId { get; set; } = string.Empty;

    [BsonElement("cardId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string CardId { get; set; } = string.Empty;

    [BsonElement("mode")]
    public string Mode { get; set; } = "Standard"; // "Standard" | "ExactMatch"

    [BsonElement("rating")]
    public string Rating { get; set; } = "Normal"; // "Hard" | "Normal" | "Easy"

    [BsonElement("typedAnswer")]
    public string? TypedAnswer { get; set; }

    [BsonElement("isExactMatch")]
    public bool? IsExactMatch { get; set; }

    [BsonElement("durationMs")]
    public int DurationMs { get; set; }

    [BsonElement("reviewedAt")]
    public DateTime ReviewedAt { get; set; } = DateTime.UtcNow;
}
