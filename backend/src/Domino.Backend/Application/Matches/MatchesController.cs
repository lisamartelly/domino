using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using Domino.Backend.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Domino.Backend.Application.Matches;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MatchesController(IMatchesService service) : ControllerBase
{
    private int CurrentUserId =>
        int.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value, CultureInfo.InvariantCulture);

    [HttpGet]
    public async Task<IActionResult> List()
    {
        return Ok(await service.ListForUserAsync(CurrentUserId));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SuperDuperAdmin")]
    public async Task<IActionResult> Create([FromBody] CreateMatchRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await service.CreateAsync(request, CurrentUserId);
        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error!.Message });
        }

        return Created($"/api/matches/{result.Value}", new { publicId = result.Value });
    }

    [HttpGet("{publicId}")]
    public async Task<IActionResult> Get(string publicId)
    {
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("SuperDuperAdmin");
        var result = await service.GetAsync(publicId, CurrentUserId, isAdmin);
        return ToActionResult(result);
    }

    [HttpPost("{publicId}/respond")]
    public async Task<IActionResult> Respond(string publicId, [FromBody] RespondToMatchRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await service.RespondAsync(publicId, CurrentUserId, request.Accepted);
        return ToActionResult(result);
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

public record CreateMatchRequest
{
    [Required]
    public required int UserId1 { get; init; }

    [Required]
    public required int UserId2 { get; init; }

    [Required]
    [MaxLength(1000)]
    public required string Narrative { get; init; }

    [Required]
    [MinLength(3)]
    [MaxLength(3)]
    public required List<int> ActivityIdeaIds { get; init; }
}

public record RespondToMatchRequest
{
    [Required]
    public required bool Accepted { get; init; }
}

public record MatchDetailDto
{
    public required string PublicId { get; init; }
    public required string Narrative { get; init; }
    public required List<MatchUserDto> Users { get; init; }
    public required bool IsExpired { get; init; }
    public required bool BothAccepted { get; init; }
    public required List<MatchActivityIdeaDto> ActivityIdeas { get; init; }
    public required DateTime CreatedAt { get; init; }
    public bool? CurrentUserAccepted { get; init; }
}

public record MatchUserDto
{
    public required int UserId { get; init; }
    public required string FirstName { get; init; }
    public required string LastInitial { get; init; }
    public required int Age { get; init; }
    public bool? Accepted { get; init; }
}

public record MatchActivityIdeaDto
{
    public required int Id { get; init; }
    public required string Name { get; init; }
    public required string Description { get; init; }
}
