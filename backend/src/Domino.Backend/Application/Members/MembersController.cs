using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Domino.Backend.Application.Members;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,SuperDuperAdmin")]
public class MembersController(IMembersService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var currentUserId = int.Parse(
            User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value,
            CultureInfo.InvariantCulture);

        return Ok(await service.ListAsync(currentUserId));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var detail = await service.GetByIdAsync(id);
        if (detail is null)
        {
            return NotFound();
        }
        return Ok(detail);
    }
}

public record MemberDto
{
    public required int Id { get; init; }
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public required DateOnly Birthday { get; init; }
    public required MatchStatsDto MatchStats { get; init; }
}

public record MemberDetailDto
{
    public required int Id { get; init; }
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public required DateOnly Birthday { get; init; }
    public required MatchStatsDto MatchStats { get; init; }
    public required List<PastMatchDto> PastMatches { get; init; }
}

public record MatchStatsDto
{
    public int TotalMatches { get; init; }
    public int Accepted { get; init; }
    public int Denied { get; init; }
    public int Pending { get; init; }
}

public record PastMatchDto
{
    public required string MatchPublicId { get; init; }
    public required string OtherUserName { get; init; }
    public bool? Accepted { get; init; }
    public DateTime CreatedAt { get; init; }
}
