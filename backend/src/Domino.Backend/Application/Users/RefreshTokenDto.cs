namespace Domino.Backend.Application.Users;

public record RefreshTokenDto (string TokenHash, DateTime ExpiresAt, string TokenFamilyId);