using Flashcards.Api.Models;
using Flashcards.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Flashcards.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FoldersController : ControllerBase
{
    private readonly FlashcardService _service;

    public FoldersController(FlashcardService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<Folder>>> GetFolders()
    {
        return Ok(await _service.GetFoldersAsync());
    }

    [HttpPost]
    public async Task<ActionResult<Folder>> CreateFolder([FromBody] CreateFolderDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("Folder name is required.");

        var folder = await _service.CreateFolderAsync(dto);
        return CreatedAtAction(nameof(GetFolders), new { id = folder.Id }, folder);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Folder>> UpdateFolder(string id, [FromBody] UpdateFolderDto dto)
    {
        var updated = await _service.UpdateFolderAsync(id, dto);
        return updated == null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFolder(string id)
    {
        var deleted = await _service.DeleteFolderAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
