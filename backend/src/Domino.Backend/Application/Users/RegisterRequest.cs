using System.ComponentModel.DataAnnotations;

namespace Domino.Backend.Application.Users;

public record RegisterRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public required string Email { get; init; }

    [Required]
    [MinLength(6)]
    [MaxLength(100)]
    public required string Password { get; init; }

    [Required]
    [MaxLength(100)]
    public required string FirstName { get; init; }

    [Required]
    [MaxLength(100)]
    public required string LastName { get; init; }

    [Required]
    public required DateOnly Birthday { get; init; }
}

