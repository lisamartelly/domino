namespace Domino.Backend.Application.Users;

public record LoginResponse
{
    public required bool Success { get; init; }
    public string? Message { get; init; }
    public string? AccessToken { get; init; }
    public UserDto? User { get; init; }
}
