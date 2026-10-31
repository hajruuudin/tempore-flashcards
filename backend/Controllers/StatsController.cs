using Flashcards.Api.Models;
using Flashcards.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Flashcards.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatsController : ControllerBase
{
    private readonly FlashcardService _service;

    public StatsController(FlashcardService service)
    {
        _service = service;
    }

    [HttpGet("overall")]
    public async Task<ActionResult<OverallStatsDto>> GetOverallStats()
    {
        return Ok(await _service.GetOverallStatsAsync());
    }

    [HttpGet("deck/{deckId}")]
    public async Task<ActionResult<DeckSummaryDto>> GetDeckStats(string deckId)
    {
        var stats = await _service.GetDeckSummaryByIdAsync(deckId);
        return stats == null ? NotFound() : Ok(stats);
    }
}
