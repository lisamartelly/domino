namespace Domino.Backend.Application.Users;

public record UserDto
{
    public required int Id { get; init; }
    public required string Email { get; init; }
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public List<string> Roles { get; init; } = [];
}
