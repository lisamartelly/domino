namespace Domino.Backend.Application.Users;

public record LoginResponse
{
    public required bool Success { get; init; }
    public string? Message { get; init; }
    public UserDto? User { get; init; }
}

public record UserDto
{
    public required string Id { get; init; }
    public required string Email { get; init; }
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
}

