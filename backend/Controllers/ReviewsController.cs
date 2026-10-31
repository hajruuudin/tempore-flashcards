using Flashcards.Api.Models;
using Flashcards.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Flashcards.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly FlashcardService _service;

    public ReviewsController(FlashcardService service)
    {
        _service = service;
    }

    [HttpGet("session")]
    public async Task<ActionResult<List<Flashcard>>> GetSessionCards(
        [FromQuery] string deckId,
        [FromQuery] int limit = 20,
        [FromQuery] string order = "random",
        [FromQuery] string? difficultyFilter = null)
    {
        if (string.IsNullOrWhiteSpace(deckId))
            return BadRequest("deckId is required.");

        var cards = await _service.GetReviewSessionCardsAsync(deckId, limit, order, difficultyFilter);
        return Ok(cards);
    }

    [HttpPost("submit")]
    public async Task<ActionResult<SubmitReviewResultDto>> SubmitReview([FromBody] SubmitReviewDto dto)
    {
        var result = await _service.SubmitReviewAsync(dto);
        return result == null ? NotFound("Card not found.") : Ok(result);
    }
}
