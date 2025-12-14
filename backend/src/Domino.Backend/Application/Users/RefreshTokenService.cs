using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;

namespace Domino.Backend.Application.Users;

public class RefreshTokenService
{
    private readonly UserManager<UserModel> _userManager;
    private const string TokenProvider = "RefreshToken";
    private const string TokenName = "RefreshToken";

    public RefreshTokenService(UserManager<UserModel> userManager)
    {
        _userManager = userManager;
    }

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
        
        await _userManager.SetAuthenticationTokenAsync(
            user,
            TokenProvider,
            TokenName,
            tokenValue
        );
    }

    /// <summary>
    /// Validates a refresh token by comparing hash and checking expiration
    /// Note: This implementation requires the user ID to be passed for efficiency
    /// </summary>
    public async Task<(bool IsValid, UserModel? User, string? TokenFamilyId)> ValidateRefreshTokenAsync(string refreshToken, string? userId = null)
    {
        var tokenHash = HashToken(refreshToken);
        
        // If userId is provided, validate directly (more efficient)
        if (!string.IsNullOrEmpty(userId))
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return (false, null, null);
            }

            var storedToken = await _userManager.GetAuthenticationTokenAsync(
                user,
                TokenProvider,
                TokenName
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

            // Check expiration
            if (DateTime.TryParse(parts[1], out var expiresAt) && expiresAt < DateTime.UtcNow)
            {
                // Token expired, remove it
                await _userManager.RemoveAuthenticationTokenAsync(user, TokenProvider, TokenName);
                return (false, null, null);
            }

            var tokenFamilyId = parts.Length > 2 ? parts[2] : null;
            return (true, user, tokenFamilyId);
        }

        // Fallback: Search all users (less efficient, but works if userId not available)
        // This should rarely be used in practice
        var users = _userManager.Users.ToList();
        foreach (var user in users)
        {
            var storedToken = await _userManager.GetAuthenticationTokenAsync(
                user,
                TokenProvider,
                TokenName
            );

            if (string.IsNullOrEmpty(storedToken))
            {
                continue;
            }

            var parts = storedToken.Split('|');
            if (parts.Length < 2)
            {
                continue;
            }

            var storedHash = parts[0];
            if (storedHash != tokenHash)
            {
                continue;
            }

            // Check expiration
            if (DateTime.TryParse(parts[1], out var expiresAt) && expiresAt < DateTime.UtcNow)
            {
                // Token expired, remove it
                await _userManager.RemoveAuthenticationTokenAsync(user, TokenProvider, TokenName);
                continue;
            }

            var tokenFamilyId = parts.Length > 2 ? parts[2] : null;
            return (true, user, tokenFamilyId);
        }

        return (false, null, null);
    }

    /// <summary>
    /// Revokes a refresh token for a user
    /// </summary>
    public async Task RevokeRefreshTokenAsync(UserModel user)
    {
        await _userManager.RemoveAuthenticationTokenAsync(user, TokenProvider, TokenName);
    }

    /// <summary>
    /// Revokes all refresh tokens for a user (useful for logout or security incidents)
    /// </summary>
    public async Task RevokeAllRefreshTokensAsync(UserModel user)
    {
        // Remove all authentication tokens for this provider
        await _userManager.RemoveAuthenticationTokenAsync(user, TokenProvider, TokenName);
    }
}

