using Domino.Backend.Utilities;

namespace Domino.Backend.Application.Matches;

public interface IMatchesService
{
    Task<List<MatchSummaryDto>> ListForUserAsync(int userId);
    Task<ServiceResult<string>> CreateAsync(CreateMatchRequest request, int createdByUserId);
    Task<ServiceResult<MatchDetailDto>> GetAsync(string publicId, int currentUserId, bool isAdmin);
    Task<ServiceResult<RespondResult>> RespondAsync(string publicId, int currentUserId, bool accepted);
}

public record MatchSummaryDto
{
    public required string PublicId { get; init; }
    public required string OtherUserName { get; init; }
    public required string Status { get; init; }
    public required DateTime CreatedAt { get; init; }
}

public record RespondResult
{
    public required bool Accepted { get; init; }
    public required bool BothAccepted { get; init; }
}
