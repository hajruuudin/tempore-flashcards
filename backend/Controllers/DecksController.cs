using Flashcards.Api.Models;
using Flashcards.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Flashcards.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DecksController : ControllerBase
{
    private readonly FlashcardService _service;

    public DecksController(FlashcardService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<DeckSummaryDto>>> GetDecks([FromQuery] string? folderId = null)
    {
        return Ok(await _service.GetDecksWithStatsAsync(folderId));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DeckSummaryDto>> GetDeck(string id)
    {
        var summary = await _service.GetDeckSummaryByIdAsync(id);
        return summary == null ? NotFound() : Ok(summary);
    }

    [HttpPost]
    public async Task<ActionResult<Deck>> CreateDeck([FromBody] CreateDeckDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("Deck name is required.");

        var deck = await _service.CreateDeckAsync(dto);
        return CreatedAtAction(nameof(GetDeck), new { id = deck.Id }, deck);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Deck>> UpdateDeck(string id, [FromBody] UpdateDeckDto dto)
    {
        var updated = await _service.UpdateDeckAsync(id, dto);
        return updated == null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDeck(string id)
    {
        var deleted = await _service.DeleteDeckAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    [HttpGet("{id}/export-csv")]
    public async Task<IActionResult> ExportCsv(string id)
    {
        var deck = await _service.GetDeckSummaryByIdAsync(id);
        if (deck == null) return NotFound();

        var csvBytes = await _service.ExportDeckToCsvAsync(id);
        var safeFileName = $"{deck.Name.Replace(" ", "_").ToLowerInvariant()}_cards.csv";
        return File(csvBytes, "text/csv", safeFileName);
    }

    [HttpPost("{id}/import-csv")]
    public async Task<IActionResult> ImportCsv(string id, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("A valid .csv file is required.");

        using var stream = file.OpenReadStream();
        var importedCount = await _service.ImportCardsFromCsvAsync(id, stream);
        return Ok(new { importedCount });
    }
}
