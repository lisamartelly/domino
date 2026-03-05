using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;

namespace Domino.Backend.Application.Users;

public class RefreshTokenService(UserManager<UserModel> userManager)
{
    private readonly string _tokenProvider = "RefreshToken";
    private readonly string _tokenName = "RefreshToken";

    /// <summary>
    /// Generates a cryptographically secure random refresh token
    /// </summary>
    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[32];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(randomBytes);
        }
        return Convert.ToBase64String(randomBytes);
    }

    /// <summary>
    /// Hashes a refresh token using SHA-256
    /// </summary>
    public string HashToken(string token)
    {
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(hashBytes);
    }

    /// <summary>
    /// Stores a refresh token hash in the database using Identity's token storage
    /// </summary>
    public async Task StoreRefreshTokenAsync(UserModel user, string refreshToken, DateTime expiresAt, string? tokenFamilyId = null)
    {
        var tokenHash = HashToken(refreshToken);
        var tokenValue = $"{tokenHash}|{expiresAt:O}|{tokenFamilyId ?? Guid.NewGuid().ToString()}";
        
        _ = await userManager.SetAuthenticationTokenAsync(
            user,
            _tokenProvider,
            _tokenName,
            tokenValue
        );
    }

    /// <summary>
    /// Validates a refresh token by comparing hash and checking expiration.
    /// </summary>
    public async Task<(bool IsValid, UserModel? User, string? TokenFamilyId)> ValidateRefreshTokenAsync(string refreshToken, string userId)
    {
        var tokenHash = HashToken(refreshToken);

        var user = await userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return (false, null, null);
        }

        var storedToken = await userManager.GetAuthenticationTokenAsync(
            user,
            _tokenProvider,
            _tokenName
        );

        if (string.IsNullOrEmpty(storedToken))
        {
            return (false, null, null);
        }

        var parts = storedToken.Split('|');
        if (parts.Length < 2)
        {
            return (false, null, null);
        }

        var storedHash = parts[0];
        if (storedHash != tokenHash)
        {
            return (false, null, null);
        }

        if (DateTime.TryParse(parts[1], out var expiresAt) && expiresAt < DateTime.UtcNow)
        {
            _ = await userManager.RemoveAuthenticationTokenAsync(user, _tokenProvider, _tokenName);
            return (false, null, null);
        }

        var tokenFamilyId = parts.Length > 2 ? parts[2] : null;
        return (true, user, tokenFamilyId);
    }

    /// <summary>
    /// Revokes a refresh token for a user
    /// </summary>

    public Task RevokeRefreshTokenAsync(UserModel user) => 
        userManager.RemoveAuthenticationTokenAsync(user, _tokenProvider, _tokenName);


    /// <summary>
    /// Revokes all refresh tokens for a user (useful for logout or security incidents)
    /// </summary>
    public Task RevokeAllRefreshTokensAsync(UserModel user) =>
        userManager.RemoveAuthenticationTokenAsync(user, _tokenProvider, _tokenName);
}
