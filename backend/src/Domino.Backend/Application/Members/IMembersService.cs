namespace Domino.Backend.Application.Members;

public interface IMembersService
{
    Task<List<MemberDto>> ListAsync(int excludeUserId);
    Task<MemberDetailDto?> GetByIdAsync(int id);
}
