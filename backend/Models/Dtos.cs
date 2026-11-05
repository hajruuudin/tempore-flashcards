namespace Flashcards.Api.Models;

public record CreateFolderDto(string Name, string? Description, string? Color);
public record UpdateFolderDto(string Name, string? Description, string? Color);

public record CreateDeckDto(string Name, string? Description, string? FolderId);
public record UpdateDeckDto(string Name, string? Description, string? FolderId);

public record CreateCardDto(string DeckId, string Front, string Back, List<string>? Tags);
public record UpdateCardDto(string Front, string Back, List<string>? Tags, string? DeckId);

public record SubmitReviewDto(
    string DeckId,
    string CardId,
    string Mode,        // "Standard" or "ExactMatch"
    string Rating,      // "Hard", "Normal", or "Easy"
    string? TypedAnswer,
    int DurationMs = 0
);

public record SubmitReviewResultDto(
    Flashcard Card,
    ReviewLog Log,
    bool IsExactMatch
);

public class DeckSummaryDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? FolderId { get; set; }
    public string? FolderName { get; set; }
    public int TotalCards { get; set; }
    public int CardsAddedToday { get; set; }
    public int TotalReviews { get; set; }
    public int HardCount { get; set; }
    public int NormalCount { get; set; }
    public int EasyCount { get; set; }
    public double MasteryPercentage { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastReviewedAt { get; set; }
}

public class DailyActivityPoint
{
    public string Date { get; set; } = string.Empty; // YYYY-MM-DD
    public int ReviewsCount { get; set; }
    public int CardsAddedCount { get; set; }
    public int HardCount { get; set; }
    public int NormalCount { get; set; }
    public int EasyCount { get; set; }
}

public class MonthlyActivityPoint
{
    public string Month { get; set; } = string.Empty; // YYYY-MM
    public int ReviewsCount { get; set; }
    public int CardsAddedCount { get; set; }
}

public class OverallStatsDto
{
    public int TotalDecks { get; set; }
    public int TotalFolders { get; set; }
    public int TotalCards { get; set; }
    public int CardsAddedToday { get; set; }
    public int TotalReviews { get; set; }
    public int ReviewsToday { get; set; }
    public int HardTotal { get; set; }
    public int NormalTotal { get; set; }
    public int EasyTotal { get; set; }
    public double ExactMatchAccuracy { get; set; }
    public List<DailyActivityPoint> Last7DaysActivity { get; set; } = new();
    public List<MonthlyActivityPoint> Last6MonthsActivity { get; set; } = new();
    public List<DeckSummaryDto> DeckBreakdown { get; set; } = new();
}

public class CsvCardRow
{
    public string Front { get; set; } = string.Empty;
    public string Back { get; set; } = string.Empty;
    public string Tags { get; set; } = string.Empty;
}
