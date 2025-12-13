namespace Domino.Backend.Application.Users;

public record RegisterResponse
{
    public required bool Success { get; init; }
    public string? Message { get; init; }
    public List<string> Errors { get; init; } = [];
}

