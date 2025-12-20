namespace Domino.Backend.Application.Users;

public interface IRefreshTokenService
{
    /// <summary>
    /// Generates a cryptographically secure random refresh token
    /// </summary>
    string GenerateRefreshToken();

    /// <summary>
    /// Stores a refresh token hash in the database using Identity's token storage
    /// </summary>
    Task StoreRefreshTokenAsync(UserModel user, string refreshToken, DateTime expiresAt, string? tokenFamilyId = null);

    /// <summary>
    /// Validates a refresh token by comparing hash and checking expiration
    /// Note: This implementation requires the user ID to be passed for efficiency
    /// </summary>
    Task<(bool IsValid, UserModel? User, string? TokenFamilyId)> ValidateRefreshTokenAsync(string refreshToken, string? userId = null);

    /// <summary>
    /// Revokes a refresh token for a user
    /// </summary>
    Task RevokeRefreshTokenAsync(UserModel user);

    /// <summary>
    /// Revokes all refresh tokens for a user (useful for logout or security incidents)
    /// </summary>
    Task RevokeAllRefreshTokensAsync(UserModel user);
}
