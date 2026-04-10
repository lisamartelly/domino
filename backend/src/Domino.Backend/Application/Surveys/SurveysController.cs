using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using Domino.Backend.Utilities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Domino.Backend.Application.Surveys;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SurveysController(ISurveysService service) : ControllerBase
{
    private int CurrentUserId =>
        int.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value, CultureInfo.InvariantCulture);

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var result = await service.GetBySlugAsync(slug);
        return ToActionResult(result);
    }

    [HttpPost("{slug}/responses")]
    public async Task<IActionResult> SubmitResponse(string slug, [FromBody] SubmitSurveyRequest request)
    {
        Console.WriteLine($"SubmitResponse: {slug}, {CurrentUserId}, {request.Answers}");
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await service.SubmitResponseAsync(slug, CurrentUserId, request.Answers);
        if (!result.IsSuccess)
        {
            return result.Error!.Kind switch
            {
                ServiceErrorKind.NotFound => NotFound(new { message = result.Error.Message }),
                _ => BadRequest(new { message = result.Error.Message }),
            };
        }

        return Ok(new { success = true });
    }

    [HttpGet("{slug}/responses/{userId:int}")]
    [Authorize(Roles = "Admin,SuperDuperAdmin")]
    public async Task<IActionResult> GetUserResponse(string slug, int userId)
    {
        var result = await service.GetUserResponseAsync(slug, userId);
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

public record SubmitSurveyRequest
{
    [Required]
    public required List<SubmitAnswerRequest> Answers { get; init; }
}

public record SubmitAnswerRequest
{
    [Required]
    public required int QuestionVersionId { get; init; }

    public string? TextValue { get; init; }
    public decimal? NumberValue { get; init; }
    public bool? BooleanValue { get; init; }
    public List<int>? SelectedOptionIds { get; init; }
}
