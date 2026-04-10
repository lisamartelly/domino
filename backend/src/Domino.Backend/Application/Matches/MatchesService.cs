using Domino.Backend.Application.Matches.Models;
using Domino.Backend.Utilities;
using Microsoft.EntityFrameworkCore;

namespace Domino.Backend.Application.Matches;

public class MatchesService(DominoDbContext db) : IMatchesService
{
#pragma warning disable CA1845
    public async Task<List<MatchSummaryDto>> ListForUserAsync(int userId)
    {
        return await db.MatchUsers
            .Where(mu => mu.UserId == userId)
            .OrderByDescending(mu => mu.CreatedAt)
            .Select(mu => new MatchSummaryDto
            {
                PublicId = mu.Match!.PublicId,
                OtherUserName = db.MatchUsers
                    .Where(other => other.MatchId == mu.MatchId && other.UserId != userId)
                    .Select(other => other.User!.FirstName + " " + other.User!.LastName.Substring(0, 1) + ".")
                    .FirstOrDefault() ?? "Unknown",
                Status = mu.Match.CreatedAt.AddHours(24) < DateTime.UtcNow
                            && mu.Match.MatchUsers.Any(m => m.Accepted == null)
                    ? "expired"
                    : mu.Match.MatchUsers.All(m => m.Accepted == true)
                        ? "accepted"
                        : mu.Match.MatchUsers.Any(m => m.Accepted == false)
                            ? "denied"
                            : "pending",
                CreatedAt = mu.CreatedAt
            })
            .ToListAsync();
    }
#pragma warning restore CA1845

    public async Task<ServiceResult<string>> CreateAsync(CreateMatchRequest request, int createdByUserId)
    {
        if (request.UserId1 == request.UserId2)
        {
            return ServiceResult.Invalid<string>("Cannot match a user with themselves.");
        }

        if (request.ActivityIdeaIds.Count != 3)
        {
            return ServiceResult.Invalid<string>("Exactly 3 activity ideas are required.");
        }

        if (request.ActivityIdeaIds.Distinct().Count() != 3)
        {
            return ServiceResult.Invalid<string>("Activity ideas must be unique.");
        }

        var user1Exists = await db.Users.AnyAsync(u => u.Id == request.UserId1 && u.IsActive);
        var user2Exists = await db.Users.AnyAsync(u => u.Id == request.UserId2 && u.IsActive);
        if (!user1Exists || !user2Exists)
        {
            return ServiceResult.Invalid<string>("One or both users not found.");
        }

        var validIdeaCount = await db.ActivityIdeas
            .CountAsync(a => request.ActivityIdeaIds.Contains(a.Id));
        if (validIdeaCount != 3)
        {
            return ServiceResult.Invalid<string>("One or more activity ideas not found.");
        }

        var match = new MatchModel
        {
            Narrative = request.Narrative,
            CreatedByUserId = createdByUserId
        };

        db.Matches.Add(match);
        await db.SaveChangesAsync();

        db.MatchUsers.AddRange(
            new MatchUserModel { MatchId = match.Id, UserId = request.UserId1 },
            new MatchUserModel { MatchId = match.Id, UserId = request.UserId2 }
        );

        db.MatchActivityIdeas.AddRange(
            request.ActivityIdeaIds.Select(ideaId => new MatchActivityIdeaModel
            {
                MatchId = match.Id,
                ActivityIdeaId = ideaId
            })
        );

        await db.SaveChangesAsync();

        return ServiceResult.Success(match.PublicId);
    }

    public async Task<ServiceResult<MatchDetailDto>> GetAsync(string publicId, int currentUserId, bool isAdmin)
    {
        var match = await db.Matches
            .Include(m => m.MatchUsers).ThenInclude(mu => mu.User)
            .Include(m => m.MatchActivityIdeas).ThenInclude(mai => mai.ActivityIdea)
            .FirstOrDefaultAsync(m => m.PublicId == publicId);

        if (match is null)
        {
            return ServiceResult.NotFound<MatchDetailDto>("Match not found.");
        }

        var isParticipant = match.MatchUsers.Any(mu => mu.UserId == currentUserId);
        if (!isParticipant && !isAdmin)
        {
            return ServiceResult.NotFound<MatchDetailDto>("Match not found.");
        }

        var isExpired = DateTime.UtcNow > match.CreatedAt.AddHours(24);
        var bothAccepted = match.MatchUsers.All(mu => mu.Accepted == true);

        var users = match.MatchUsers.Select(mu => new MatchUserDto
        {
            UserId = mu.UserId,
            FirstName = mu.User!.FirstName,
            LastInitial = mu.User.LastName.Length > 0
                ? string.Concat(mu.User.LastName.AsSpan(0, 1), ".")
                : "",
            Age = CalculateAge(mu.User.Birthday),
            Accepted = mu.Accepted
        }).ToList();

        var dto = new MatchDetailDto
        {
            PublicId = match.PublicId,
            Narrative = match.Narrative,
            Users = users,
            IsExpired = isExpired,
            BothAccepted = bothAccepted,
            ActivityIdeas = bothAccepted
                ? match.MatchActivityIdeas.Select(mai => new MatchActivityIdeaDto
                {
                    Id = mai.ActivityIdea!.Id,
                    Name = mai.ActivityIdea.Name,
                    Description = mai.ActivityIdea.Description
                }).ToList()
                : [],
            CreatedAt = match.CreatedAt,
            CurrentUserAccepted = match.MatchUsers
                .FirstOrDefault(mu => mu.UserId == currentUserId)?.Accepted
        };

        return ServiceResult.Success(dto);
    }

    public async Task<ServiceResult<RespondResult>> RespondAsync(string publicId, int currentUserId, bool accepted)
    {
        var match = await db.Matches
            .Include(m => m.MatchUsers)
            .FirstOrDefaultAsync(m => m.PublicId == publicId);

        if (match is null)
        {
            return ServiceResult.NotFound<RespondResult>("Match not found.");
        }

        var matchUser = match.MatchUsers.FirstOrDefault(mu => mu.UserId == currentUserId);
        if (matchUser is null)
        {
            return ServiceResult.NotFound<RespondResult>("Match not found.");
        }

        if (DateTime.UtcNow > match.CreatedAt.AddHours(24))
        {
            return ServiceResult.Invalid<RespondResult>(
                "This match has expired. Responses are no longer accepted.");
        }

        if (matchUser.Accepted is not null)
        {
            return ServiceResult.Invalid<RespondResult>(
                "You have already responded to this match.");
        }

        matchUser.Accepted = accepted;
        await db.SaveChangesAsync();

        var bothAccepted = match.MatchUsers.All(mu => mu.Accepted == true);

        return ServiceResult.Success(
            new RespondResult { Accepted = accepted, BothAccepted = bothAccepted });
    }

    private static int CalculateAge(DateOnly birthday)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var age = today.Year - birthday.Year;
        if (birthday.AddYears(age) > today)
        {
            age--;
        }
        return age;
    }
}
