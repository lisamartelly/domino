using System.ComponentModel.DataAnnotations;

namespace Domino.Backend.Application.Users;

public record LoginRequest
{
    [Required]
    [EmailAddress]
    public required string Email { get; init; }

    [Required]
    public required string Password { get; init; }
}

