using Flashcards.Api.Models;
using Flashcards.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Flashcards.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CardsController : ControllerBase
{
    private readonly FlashcardService _service;

    public CardsController(FlashcardService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<Flashcard>>> GetCards(
        [FromQuery] string? deckId = null,
        [FromQuery] string? search = null,
        [FromQuery] string? tag = null)
    {
        return Ok(await _service.GetCardsAsync(deckId, search, tag));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Flashcard>> GetCard(string id)
    {
        var card = await _service.GetCardByIdAsync(id);
        return card == null ? NotFound() : Ok(card);
    }

    [HttpPost]
    public async Task<ActionResult<Flashcard>> CreateCard([FromBody] CreateCardDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.DeckId) ||
            string.IsNullOrWhiteSpace(dto.Front) ||
            string.IsNullOrWhiteSpace(dto.Back))
        {
            return BadRequest("DeckId, Front, and Back are required.");
        }

        var card = await _service.CreateCardAsync(dto);
        return CreatedAtAction(nameof(GetCard), new { id = card.Id }, card);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Flashcard>> UpdateCard(string id, [FromBody] UpdateCardDto dto)
    {
        var updated = await _service.UpdateCardAsync(id, dto);
        return updated == null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCard(string id)
    {
        var deleted = await _service.DeleteCardAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
