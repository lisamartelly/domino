using Domino.Backend.Utilities;

namespace Domino.Backend.Application.Surveys;

public interface ISurveysService
{
    Task<ServiceResult<SurveyDto>> GetBySlugAsync(string slug);
    Task<ServiceResult<bool>> SubmitResponseAsync(string slug, int userId, List<SubmitAnswerRequest> answers);
    Task<ServiceResult<SurveyResponseDto>> GetUserResponseAsync(string slug, int userId);
}

public record SurveyDto
{
    public required int Id { get; init; }
    public required string Name { get; init; }
    public required string Slug { get; init; }
    public required string Description { get; init; }
    public required int VersionId { get; init; }
    public required List<QuestionDto> Questions { get; init; }
}

public record QuestionDto
{
    public required int QuestionVersionId { get; init; }
    public required string StableKey { get; init; }
    public required string? QuestionGroup { get; init; }
    public required string Prompt { get; init; }
    public required string QuestionType { get; init; }
    public required bool Required { get; init; }
    public required List<QuestionOptionDto> Options { get; init; }
}

public record QuestionOptionDto
{
    public required int Id { get; init; }
    public required string Value { get; init; }
    public required string DisplayValue { get; init; }
    public required int SortOrder { get; init; }
}

public record SurveyAnswerDto
{
    public required string Prompt { get; init; }
    public required string? QuestionGroup { get; init; }
    public required string QuestionType { get; init; }
    public required string? Answer { get; init; }
}

public record SurveyResponseDto
{
    public required string SurveyName { get; init; }
    public required DateTime CompletedAt { get; init; }
    public required List<SurveyAnswerDto> Answers { get; init; }
}
