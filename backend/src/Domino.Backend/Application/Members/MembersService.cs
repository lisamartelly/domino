using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Domino.Backend.Application.Members;

public class MembersService(DominoDbContext db) : IMembersService
{
    private static readonly string[] AdminRoles = ["Admin", "SuperDuperAdmin"];

    public async Task<List<MemberDto>> ListAsync(int excludeUserId)
    {
        var adminRoleIds = await db.Roles
            .Where(r => AdminRoles.Contains(r.Name!))
            .Select(r => r.Id)
            .ToListAsync();

        return await db.Users
            .Where(u => u.IsActive && u.Id != excludeUserId)
            .Where(u => !db.Set<IdentityUserRole<int>>().Any(ur => ur.UserId == u.Id && adminRoleIds.Contains(ur.RoleId)))
            .OrderBy(u => u.FirstName).ThenBy(u => u.LastName)
            .Select(u => new MemberDto
            {
                Id = u.Id,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Birthday = u.Birthday,
                MatchStats = new MatchStatsDto
                {
                    TotalMatches = db.MatchUsers.Count(mu => mu.UserId == u.Id),
                    Accepted = db.MatchUsers.Count(mu => mu.UserId == u.Id && mu.Accepted == true),
                    Denied = db.MatchUsers.Count(mu => mu.UserId == u.Id && mu.Accepted == false),
                    Pending = db.MatchUsers.Count(mu => mu.UserId == u.Id && mu.Accepted == null),
                }
            })
            .ToListAsync();
    }

    public async Task<MemberDetailDto?> GetByIdAsync(int id)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id && u.IsActive);
        if (user is null)
        {
            return null;
        }

        var matchStats = new MatchStatsDto
        {
            TotalMatches = await db.MatchUsers.CountAsync(mu => mu.UserId == id),
            Accepted = await db.MatchUsers.CountAsync(mu => mu.UserId == id && mu.Accepted == true),
            Denied = await db.MatchUsers.CountAsync(mu => mu.UserId == id && mu.Accepted == false),
            Pending = await db.MatchUsers.CountAsync(mu => mu.UserId == id && mu.Accepted == null),
        };

#pragma warning disable CA1845 // Substring in EF expression tree — can't use span-based concat
        var pastMatches = await db.MatchUsers
            .Where(mu => mu.UserId == id && mu.Match != null)
            .OrderByDescending(mu => mu.CreatedAt)
            .Take(10)
            .Select(mu => new PastMatchDto
            {
                MatchPublicId = mu.Match!.PublicId,
                OtherUserName = db.MatchUsers
                    .Where(other => other.MatchId == mu.MatchId && other.UserId != id)
                    .Select(other => other.User!.FirstName + " " + other.User!.LastName.Substring(0, 1) + ".")
                    .FirstOrDefault() ?? "Unknown",
                Accepted = mu.Accepted,
                CreatedAt = mu.CreatedAt
            })
            .ToListAsync();
#pragma warning restore CA1845

        return new MemberDetailDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Birthday = user.Birthday,
            MatchStats = matchStats,
            PastMatches = pastMatches
        };
    }
}
