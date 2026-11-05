using System.Globalization;
using System.Text;
using CsvHelper;
using CsvHelper.Configuration;
using Flashcards.Api.Models;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;

namespace Flashcards.Api.Services;

public class FlashcardService
{
    private readonly IMongoCollection<Folder> _folders;
    private readonly IMongoCollection<Deck> _decks;
    private readonly IMongoCollection<Flashcard> _cards;
    private readonly IMongoCollection<ReviewLog> _reviewLogs;

    public FlashcardService(IOptions<MongoDbSettings> settings)
    {
        var client = new MongoClient(settings.Value.ConnectionString);
        var db = client.GetDatabase(settings.Value.DatabaseName);

        _folders = db.GetCollection<Folder>("folders");
        _decks = db.GetCollection<Deck>("decks");
        _cards = db.GetCollection<Flashcard>("cards");
        _reviewLogs = db.GetCollection<ReviewLog>("review_logs");
    }

    // =========================================================================
    // FOLDERS CRUD
    // =========================================================================

    public async Task<List<Folder>> GetFoldersAsync() =>
        await _folders.Find(_ => true).SortBy(f => f.Name).ToListAsync();

    public async Task<Folder> CreateFolderAsync(CreateFolderDto dto)
    {
        var folder = new Folder
        {
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            Color = string.IsNullOrWhiteSpace(dto.Color) ? "wine-plum" : dto.Color,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _folders.InsertOneAsync(folder);
        return folder;
    }

    public async Task<Folder?> UpdateFolderAsync(string id, UpdateFolderDto dto)
    {
        var update = Builders<Folder>.Update
            .Set(f => f.Name, dto.Name.Trim())
            .Set(f => f.Description, dto.Description?.Trim())
            .Set(f => f.Color, string.IsNullOrWhiteSpace(dto.Color) ? "wine-plum" : dto.Color)
            .Set(f => f.UpdatedAt, DateTime.UtcNow);

        return await _folders.FindOneAndUpdateAsync<Folder>(
            f => f.Id == id,
            update,
            new FindOneAndUpdateOptions<Folder> { ReturnDocument = ReturnDocument.After });
    }

    public async Task<bool> DeleteFolderAsync(string id)
    {
        // Unassign decks in this folder rather than deleting user decks
        var deckUpdate = Builders<Deck>.Update.Set(d => d.FolderId, null);
        await _decks.UpdateManyAsync(d => d.FolderId == id, deckUpdate);

        var result = await _folders.DeleteOneAsync(f => f.Id == id);
        return result.DeletedCount > 0;
    }

    // =========================================================================
    // DECKS CRUD & STATS SUMMARY
    // =========================================================================

    public async Task<List<DeckSummaryDto>> GetDecksWithStatsAsync(string? folderId = null)
    {
        var filter = string.IsNullOrWhiteSpace(folderId)
            ? Builders<Deck>.Filter.Empty
            : Builders<Deck>.Filter.Eq(d => d.FolderId, folderId);

        var decks = await _decks.Find(filter).SortByDescending(d => d.UpdatedAt).ToListAsync();
        var folders = await _folders.Find(_ => true).ToListAsync();
        var folderMap = folders.Where(f => f.Id != null).ToDictionary(f => f.Id!, f => f.Name);

        var allCards = await _cards.Find(_ => true).ToListAsync();
        var todayUtc = DateTime.UtcNow.Date;

        return decks.Select(d =>
        {
            var deckCards = allCards.Where(c => c.DeckId == d.Id).ToList();
            return BuildDeckSummary(d, deckCards, folderMap, todayUtc);
        }).ToList();
    }

    public async Task<DeckSummaryDto?> GetDeckSummaryByIdAsync(string id)
    {
        var deck = await _decks.Find(d => d.Id == id).FirstOrDefaultAsync();
        if (deck == null) return null;

        var folders = await _folders.Find(_ => true).ToListAsync();
        var folderMap = folders.Where(f => f.Id != null).ToDictionary(f => f.Id!, f => f.Name);
        var deckCards = await _cards.Find(c => c.DeckId == id).ToListAsync();

        return BuildDeckSummary(deck, deckCards, folderMap, DateTime.UtcNow.Date);
    }

    private static DeckSummaryDto BuildDeckSummary(
        Deck d,
        List<Flashcard> deckCards,
        Dictionary<string, string> folderMap,
        DateTime todayUtc)
    {
        var hard = deckCards.Sum(c => c.HardCount);
        var normal = deckCards.Sum(c => c.NormalCount);
        var easy = deckCards.Sum(c => c.EasyCount);
        var totalReviews = deckCards.Sum(c => c.ReviewCount);

        double mastery = 0;
        if (deckCards.Count > 0)
        {
            var masteredCards = deckCards.Count(c => c.LastDifficulty == "Easy" || (c.EasyCount > c.HardCount && c.ReviewCount > 0));
            mastery = Math.Round((double)masteredCards / deckCards.Count * 100.0, 1);
        }

        return new DeckSummaryDto
        {
            Id = d.Id ?? string.Empty,
            Name = d.Name,
            Description = d.Description,
            FolderId = d.FolderId,
            FolderName = d.FolderId != null && folderMap.TryGetValue(d.FolderId, out var fn) ? fn : null,
            TotalCards = deckCards.Count,
            CardsAddedToday = deckCards.Count(c => c.CreatedAt.Date == todayUtc),
            TotalReviews = totalReviews,
            HardCount = hard,
            NormalCount = normal,
            EasyCount = easy,
            MasteryPercentage = mastery,
            CreatedAt = d.CreatedAt,
            LastReviewedAt = d.LastReviewedAt
        };
    }

    public async Task<Deck> CreateDeckAsync(CreateDeckDto dto)
    {
        var deck = new Deck
        {
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            FolderId = string.IsNullOrWhiteSpace(dto.FolderId) ? null : dto.FolderId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _decks.InsertOneAsync(deck);
        return deck;
    }

    public async Task<Deck?> UpdateDeckAsync(string id, UpdateDeckDto dto)
    {
        var update = Builders<Deck>.Update
            .Set(d => d.Name, dto.Name.Trim())
            .Set(d => d.Description, dto.Description?.Trim())
            .Set(d => d.FolderId, string.IsNullOrWhiteSpace(dto.FolderId) ? null : dto.FolderId)
            .Set(d => d.UpdatedAt, DateTime.UtcNow);

        return await _decks.FindOneAndUpdateAsync<Deck>(
            d => d.Id == id,
            update,
            new FindOneAndUpdateOptions<Deck> { ReturnDocument = ReturnDocument.After });
    }

    public async Task<bool> DeleteDeckAsync(string id)
    {
        await _cards.DeleteManyAsync(c => c.DeckId == id);
        await _reviewLogs.DeleteManyAsync(r => r.DeckId == id);
        var result = await _decks.DeleteOneAsync(d => d.Id == id);
        return result.DeletedCount > 0;
    }

    // =========================================================================
    // FLASHCARDS CRUD & LIVE DUPLICATE SEARCH
    // =========================================================================

    public async Task<List<Flashcard>> GetCardsAsync(string? deckId = null, string? search = null, string? tag = null)
    {
        var builder = Builders<Flashcard>.Filter;
        var filter = builder.Empty;

        if (!string.IsNullOrWhiteSpace(deckId))
        {
            filter &= builder.Eq(c => c.DeckId, deckId);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var regex = new BsonRegularExpression(search.Trim(), "i");
            filter &= builder.Or(
                builder.Regex(c => c.Front, regex),
                builder.Regex(c => c.Back, regex),
                builder.AnyEq(c => c.Tags, search.Trim().ToLowerInvariant())
            );
        }

        if (!string.IsNullOrWhiteSpace(tag))
        {
            filter &= builder.AnyEq(c => c.Tags, tag.Trim().ToLowerInvariant());
        }

        return await _cards.Find(filter).SortByDescending(c => c.CreatedAt).ToListAsync();
    }

    public async Task<Flashcard?> GetCardByIdAsync(string id) =>
        await _cards.Find(c => c.Id == id).FirstOrDefaultAsync();

    public async Task<Flashcard> CreateCardAsync(CreateCardDto dto)
    {
        var cleanTags = (dto.Tags ?? new List<string>())
            .Select(t => t.Trim().ToLowerInvariant())
            .Where(t => !string.IsNullOrEmpty(t))
            .Distinct()
            .ToList();

        var card = new Flashcard
        {
            DeckId = dto.DeckId,
            Front = dto.Front.Trim(),
            Back = dto.Back.Trim(),
            Tags = cleanTags,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _cards.InsertOneAsync(card);

        await _decks.UpdateOneAsync(
            d => d.Id == dto.DeckId,
            Builders<Deck>.Update.Set(d => d.UpdatedAt, DateTime.UtcNow));

        return card;
    }

    public async Task<Flashcard?> UpdateCardAsync(string id, UpdateCardDto dto)
    {
        var cleanTags = (dto.Tags ?? new List<string>())
            .Select(t => t.Trim().ToLowerInvariant())
            .Where(t => !string.IsNullOrEmpty(t))
            .Distinct()
            .ToList();

        var update = Builders<Flashcard>.Update
            .Set(c => c.Front, dto.Front.Trim())
            .Set(c => c.Back, dto.Back.Trim())
            .Set(c => c.Tags, cleanTags)
            .Set(c => c.UpdatedAt, DateTime.UtcNow);

        if (!string.IsNullOrWhiteSpace(dto.DeckId))
        {
            update = update.Set(c => c.DeckId, dto.DeckId);
        }

        return await _cards.FindOneAndUpdateAsync<Flashcard>(
            c => c.Id == id,
            update,
            new FindOneAndUpdateOptions<Flashcard> { ReturnDocument = ReturnDocument.After });
    }

    public async Task<bool> DeleteCardAsync(string id)
    {
        var result = await _cards.DeleteOneAsync(c => c.Id == id);
        return result.DeletedCount > 0;
    }

    // =========================================================================
    // REVIEW SESSION & SCORING (HARD / NORMAL / EASY + EXACT MATCH)
    // =========================================================================

    public async Task<List<Flashcard>> GetReviewSessionCardsAsync(
        string deckId,
        int limit = 20,
        string order = "random", // "random" | "oldest" | "newest" | "hardest"
        string? difficultyFilter = null)
    {
        var builder = Builders<Flashcard>.Filter;
        var filter = builder.Eq(c => c.DeckId, deckId);

        if (!string.IsNullOrWhiteSpace(difficultyFilter) && difficultyFilter != "All")
        {
            if (difficultyFilter == "Unreviewed")
                filter &= builder.Eq(c => c.ReviewCount, 0);
            else
                filter &= builder.Eq(c => c.LastDifficulty, difficultyFilter);
        }

        var cards = await _cards.Find(filter).ToListAsync();

        IEnumerable<Flashcard> ordered = order.ToLowerInvariant() switch
        {
            "oldest" => cards.OrderBy(c => c.CreatedAt),
            "newest" => cards.OrderByDescending(c => c.CreatedAt),
            "hardest" => cards.OrderByDescending(c => c.HardCount).ThenBy(c => c.EasyCount),
            _ => cards.OrderBy(_ => Random.Shared.Next())
        };

        return limit > 0 ? ordered.Take(limit).ToList() : ordered.ToList();
    }

    public async Task<SubmitReviewResultDto?> SubmitReviewAsync(SubmitReviewDto dto)
    {
        var card = await _cards.Find(c => c.Id == dto.CardId).FirstOrDefaultAsync();
        if (card == null) return null;

        bool isExactMatch = false;
        var effectiveRating = dto.Rating;

        if (string.Equals(dto.Mode, "ExactMatch", StringComparison.OrdinalIgnoreCase))
        {
            // Strict exact match check (trimmed)
            isExactMatch = string.Equals(
                (dto.TypedAnswer ?? string.Empty).Trim(),
                card.Back.Trim(),
                StringComparison.Ordinal);

            if (string.IsNullOrWhiteSpace(effectiveRating))
            {
                effectiveRating = isExactMatch ? "Easy" : "Hard";
            }
        }

        var now = DateTime.UtcNow;

        var cardUpdate = Builders<Flashcard>.Update
            .Inc(c => c.ReviewCount, 1)
            .Set(c => c.LastDifficulty, effectiveRating)
            .Set(c => c.LastReviewedAt, now)
            .Set(c => c.UpdatedAt, now);

        if (effectiveRating == "Hard") cardUpdate = cardUpdate.Inc(c => c.HardCount, 1);
        else if (effectiveRating == "Easy") cardUpdate = cardUpdate.Inc(c => c.EasyCount, 1);
        else cardUpdate = cardUpdate.Inc(c => c.NormalCount, 1);

        if (string.Equals(dto.Mode, "ExactMatch", StringComparison.OrdinalIgnoreCase))
        {
            cardUpdate = cardUpdate.Inc(c => c.ExactMatchAttemptCount, 1);
            if (isExactMatch)
            {
                cardUpdate = cardUpdate.Inc(c => c.ExactMatchCorrectCount, 1);
            }
        }

        var updatedCard = await _cards.FindOneAndUpdateAsync<Flashcard>(
            c => c.Id == card.Id,
            cardUpdate,
            new FindOneAndUpdateOptions<Flashcard> { ReturnDocument = ReturnDocument.After });

        var log = new ReviewLog
        {
            DeckId = card.DeckId,
            CardId = card.Id!,
            Mode = dto.Mode,
            Rating = effectiveRating,
            TypedAnswer = dto.TypedAnswer,
            IsExactMatch = string.Equals(dto.Mode, "ExactMatch", StringComparison.OrdinalIgnoreCase) ? isExactMatch : null,
            DurationMs = dto.DurationMs,
            ReviewedAt = now
        };

        await _reviewLogs.InsertOneAsync(log);

        await _decks.UpdateOneAsync(
            d => d.Id == card.DeckId,
            Builders<Deck>.Update
                .Set(d => d.LastReviewedAt, now)
                .Set(d => d.UpdatedAt, now));

        return new SubmitReviewResultDto(updatedCard, log, isExactMatch);
    }

    // =========================================================================
    // CSV EXPORT & IMPORT
    // =========================================================================

    public async Task<byte[]> ExportDeckToCsvAsync(string deckId)
    {
        var cards = await _cards.Find(c => c.DeckId == deckId).SortBy(c => c.CreatedAt).ToListAsync();
        using var memoryStream = new MemoryStream();
        using var writer = new StreamWriter(memoryStream, Encoding.UTF8);
        using var csv = new CsvWriter(writer, new CsvConfiguration(CultureInfo.InvariantCulture));

        var rows = cards.Select(c => new CsvCardRow
        {
            Front = c.Front,
            Back = c.Back,
            Tags = string.Join(";", c.Tags)
        });

        await csv.WriteRecordsAsync(rows);
        await writer.FlushAsync();
        return memoryStream.ToArray();
    }

    public async Task<int> ImportCardsFromCsvAsync(string deckId, Stream csvStream)
    {
        using var reader = new StreamReader(csvStream, Encoding.UTF8);
        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HeaderValidated = null,
            MissingFieldFound = null,
            PrepareHeaderForMatch = args => args.Header.Trim().ToLowerInvariant()
        };

        using var csv = new CsvReader(reader, config);
        var records = csv.GetRecords<CsvCardRow>().ToList();

        var newCards = new List<Flashcard>();
        var now = DateTime.UtcNow;

        foreach (var row in records)
        {
            if (string.IsNullOrWhiteSpace(row.Front) || string.IsNullOrWhiteSpace(row.Back))
                continue;

            var tags = (row.Tags ?? string.Empty)
                .Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(t => t.Trim().ToLowerInvariant())
                .Distinct()
                .ToList();

            newCards.Add(new Flashcard
            {
                DeckId = deckId,
                Front = row.Front.Trim(),
                Back = row.Back.Trim(),
                Tags = tags,
                CreatedAt = now,
                UpdatedAt = now
            });
        }

        if (newCards.Count > 0)
        {
            await _cards.InsertManyAsync(newCards);
            await _decks.UpdateOneAsync(
                d => d.Id == deckId,
                Builders<Deck>.Update.Set(d => d.UpdatedAt, now));
        }

        return newCards.Count;
    }

    // =========================================================================
    // OVERALL & PER-DECK STATISTICS
    // =========================================================================

    public async Task<OverallStatsDto> GetOverallStatsAsync()
    {
        var foldersCount = (int)await _folders.CountDocumentsAsync(_ => true);
        var decks = await GetDecksWithStatsAsync();
        var allCards = await _cards.Find(_ => true).ToListAsync();
        var todayUtc = DateTime.UtcNow.Date;
        var sevenDaysAgo = todayUtc.AddDays(-6);

        var firstMonth = new DateTime(todayUtc.Year, todayUtc.Month, 1).AddMonths(-5);
        var logsSinceFirstMonth = await _reviewLogs
            .Find(r => r.ReviewedAt >= firstMonth)
            .ToListAsync();
        var recentLogs = logsSinceFirstMonth.Where(r => r.ReviewedAt >= sevenDaysAgo).ToList();

        var activity = Enumerable.Range(0, 7).Select(offset =>
        {
            var date = sevenDaysAgo.AddDays(offset);
            return new DailyActivityPoint
            {
                Date = date.ToString("yyyy-MM-dd"),
                ReviewsCount = recentLogs.Count(r => r.ReviewedAt.Date == date),
                CardsAddedCount = allCards.Count(c => c.CreatedAt.Date == date),
                HardCount = recentLogs.Count(r => r.ReviewedAt.Date == date && r.Rating == "Hard"),
                NormalCount = recentLogs.Count(r => r.ReviewedAt.Date == date && r.Rating == "Normal"),
                EasyCount = recentLogs.Count(r => r.ReviewedAt.Date == date && r.Rating == "Easy")
            };
        }).ToList();

        var monthlyActivity = Enumerable.Range(0, 6).Select(offset =>
        {
            var monthStart = firstMonth.AddMonths(offset);
            var monthEnd = monthStart.AddMonths(1);
            return new MonthlyActivityPoint
            {
                Month = monthStart.ToString("yyyy-MM"),
                ReviewsCount = logsSinceFirstMonth.Count(r => r.ReviewedAt >= monthStart && r.ReviewedAt < monthEnd),
                CardsAddedCount = allCards.Count(c => c.CreatedAt >= monthStart && c.CreatedAt < monthEnd)
            };
        }).ToList();

        var totalExactAttempts = allCards.Sum(c => c.ExactMatchAttemptCount);
        var totalExactCorrect = allCards.Sum(c => c.ExactMatchCorrectCount);

        return new OverallStatsDto
        {
            TotalFolders = foldersCount,
            TotalDecks = decks.Count,
            TotalCards = allCards.Count,
            CardsAddedToday = allCards.Count(c => c.CreatedAt.Date == todayUtc),
            TotalReviews = allCards.Sum(c => c.ReviewCount),
            ReviewsToday = recentLogs.Count(r => r.ReviewedAt.Date == todayUtc),
            HardTotal = allCards.Sum(c => c.HardCount),
            NormalTotal = allCards.Sum(c => c.NormalCount),
            EasyTotal = allCards.Sum(c => c.EasyCount),
            ExactMatchAccuracy = totalExactAttempts > 0
                ? Math.Round((double)totalExactCorrect / totalExactAttempts * 100.0, 1)
                : 0,
            Last7DaysActivity = activity,
            Last6MonthsActivity = monthlyActivity,
            DeckBreakdown = decks
        };
    }
}
