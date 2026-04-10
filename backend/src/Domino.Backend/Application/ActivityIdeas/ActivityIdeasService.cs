using Domino.Backend.Application.ActivityIdeas.Models;
using Domino.Backend.Utilities;
using Microsoft.EntityFrameworkCore;

namespace Domino.Backend.Application.ActivityIdeas;

public class ActivityIdeasService(DominoDbContext db) : IActivityIdeasService
{
    public async Task<List<ActivityIdeaDto>> ListAsync()
    {
        return await db.ActivityIdeas
            .OrderBy(a => a.Name)
            .Select(a => new ActivityIdeaDto { Id = a.Id, Name = a.Name, Description = a.Description })
            .ToListAsync();
    }

    public async Task<ActivityIdeaDto> CreateAsync(string name, string description)
    {
        var idea = new ActivityIdeaModel
        {
            Name = name,
            Description = description
        };

        db.ActivityIdeas.Add(idea);
        await db.SaveChangesAsync();

        return new ActivityIdeaDto { Id = idea.Id, Name = idea.Name, Description = idea.Description };
    }

    public async Task<ServiceResult<ActivityIdeaDto>> UpdateAsync(int id, string name, string description)
    {
        var idea = await db.ActivityIdeas.FindAsync(id);
        if (idea is null)
        {
            return ServiceResult.NotFound<ActivityIdeaDto>("Activity idea not found.");
        }

        idea.Name = name;
        idea.Description = description;
        await db.SaveChangesAsync();

        return ServiceResult.Success(
            new ActivityIdeaDto { Id = idea.Id, Name = idea.Name, Description = idea.Description });
    }

    public async Task<ServiceResult<bool>> DeleteAsync(int id)
    {
        var idea = await db.ActivityIdeas.FindAsync(id);
        if (idea is null)
        {
            return ServiceResult.NotFound<bool>("Activity idea not found.");
        }

        db.ActivityIdeas.Remove(idea);
        await db.SaveChangesAsync();

        return ServiceResult.Success(true);
    }
}
