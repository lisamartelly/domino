using Domino.Backend.Utilities;

namespace Domino.Backend.Application.ActivityIdeas;

public interface IActivityIdeasService
{
    Task<List<ActivityIdeaDto>> ListAsync();
    Task<ActivityIdeaDto> CreateAsync(string name, string description);
    Task<ServiceResult<ActivityIdeaDto>> UpdateAsync(int id, string name, string description);
    Task<ServiceResult<bool>> DeleteAsync(int id);
}
