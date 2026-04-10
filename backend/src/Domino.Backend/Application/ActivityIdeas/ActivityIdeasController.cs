using System.ComponentModel.DataAnnotations;
using Domino.Backend.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Domino.Backend.Application.ActivityIdeas;

[ApiController]
[Route("api/activity-ideas")]
[Authorize(Roles = "Admin,SuperDuperAdmin")]
public class ActivityIdeasController(IActivityIdeasService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        return Ok(await service.ListAsync());
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateActivityIdeaRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var dto = await service.CreateAsync(request.Name, request.Description);
        return Created($"/api/activity-ideas/{dto.Id}", dto);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateActivityIdeaRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await service.UpdateAsync(id, request.Name, request.Description);
        return ToActionResult(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await service.DeleteAsync(id);
        if (!result.IsSuccess)
        {
            return NotFound();
        }
        return NoContent();
    }

    private IActionResult ToActionResult<T>(ServiceResult<T> result)
    {
        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }
        return result.Error!.Kind switch
        {
            ServiceErrorKind.NotFound => NotFound(new { message = result.Error.Message }),
            _ => BadRequest(new { message = result.Error.Message }),
        };
    }
}

public record ActivityIdeaDto
{
    public required int Id { get; init; }
    public required string Name { get; init; }
    public required string Description { get; init; }
}

public record CreateActivityIdeaRequest
{
    [Required]
    [MaxLength(100)]
    public required string Name { get; init; }

    [Required]
    [MaxLength(1000)]
    public required string Description { get; init; }
}
