using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;

namespace Domino.Backend.Application.Users;

[ApiController]
[Route("api/[controller]")]
public class AuthController(
    UserManager<UserModel> userManager,
    IRefreshTokenService refreshTokenService,
    IConfiguration configuration)
    : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();

            return BadRequest(new RegisterResponse
            {
                Success = false,
                Message = "Validation failed",
                Errors = errors
            });
        }

        var user = new UserModel
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Birthday = request.Birthday,
            IsActive = true
        };

        var result = await userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return BadRequest(new RegisterResponse
            {
                Success = false,
                Message = "Registration failed",
                Errors = errors
            });
        }

        return Ok(new RegisterResponse
        {
            Success = true,
            Message = "User registered successfully"
        });
    }

    [HttpPost("login")]
    [EnableRateLimiting("LoginPolicy")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new LoginResponse
                {
                    Success = false,
                    Message = "Invalid email or password"
                });
            }

            var user = await userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                // Generic error message to prevent user enumeration
                return Unauthorized(new LoginResponse
                {
                    Success = false,
                    Message = "Invalid email or password"
                });
            }

            // Check if user is active
            if (!user.IsActive)
            {
                return Unauthorized(new LoginResponse
                {
                    Success = false,
                    Message = "Invalid email or password"
                });
            }

            // Check for account lockout
            if (await userManager.IsLockedOutAsync(user))
            {
                return Unauthorized(new LoginResponse
                {
                    Success = false,
                    Message = "Account is locked. Please try again later."
                });
            }

            // Validate password
            var passwordValid = await userManager.CheckPasswordAsync(user, request.Password);
            if (!passwordValid)
            {
                return Unauthorized(new LoginResponse
                {
                    Success = false,
                    Message = "Invalid email or password"
                });
            }

            // Generate access token
            string accessToken;
            try
            {
                accessToken = GenerateAccessToken(user);
            }
            catch (InvalidOperationException)
            {
                // Log the error and return 500 with a generic message
                // In production, log to a proper logging service
                return StatusCode(500, new LoginResponse
                {
                    Success = false,
                    Message = "An error occurred during authentication. Please try again later."
                });
            }

            // Generate refresh token
            var refreshToken = refreshTokenService.GenerateRefreshToken();
            var refreshTokenExpiresAt = DateTime.UtcNow.AddDays(
                configuration.GetValue("JwtSettings:RefreshTokenExpirationDays", 7)
            );

            // Store refresh token
            await refreshTokenService.StoreRefreshTokenAsync(user, refreshToken, refreshTokenExpiresAt);

            // Set cookies
            Response.Cookies.Append("accessToken", accessToken, GetCookieOptions(isRefreshToken: false));
            Response.Cookies.Append("refreshToken", refreshToken, GetCookieOptions(isRefreshToken: true));

            return Ok(new LoginResponse
            {
                Success = true,
                Message = "Login successful",
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email!,
                    FirstName = user.FirstName,
                    LastName = user.LastName
                }
            });
        }
        catch (Exception)
        {
            // Log the exception (in production, use proper logging)
            // For now, return a generic error to prevent information leakage
            return StatusCode(500, new LoginResponse
            {
                Success = false,
                Message = "An error occurred during authentication. Please try again later."
            });
        }
    }

    [HttpPost("refresh")]
    [EnableRateLimiting("RefreshPolicy")]
    public async Task<IActionResult> Refresh()
    {
        // Read refresh token from cookie
        var refreshToken = Request.Cookies["refreshToken"];

        // Also try reading from Authorization header as fallback (though we prefer cookies)
        if (string.IsNullOrEmpty(refreshToken))
        {
            var authHeader = Request.Headers.Authorization.ToString();
            if (authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                refreshToken = authHeader["Bearer ".Length..].Trim();
            }
        }

        if (string.IsNullOrEmpty(refreshToken))
        {
            return Unauthorized(new { message = "Refresh token not found" });
        }

        var (isValid, user, tokenFamilyId) = await refreshTokenService.ValidateRefreshTokenAsync(refreshToken);
        if (!isValid || user == null)
        {
            return Unauthorized(new { message = "Invalid or expired refresh token" });
        }

        // Check if user is still active
        if (!user.IsActive)
        {
            await refreshTokenService.RevokeRefreshTokenAsync(user);
            return Unauthorized(new { message = "Account is inactive" });
        }

        // Generate new access token
        var newAccessToken = GenerateAccessToken(user);

        // Optionally rotate refresh token (recommended for security)
        var newRefreshToken = refreshTokenService.GenerateRefreshToken();
        var refreshTokenExpiresAt = DateTime.UtcNow.AddDays(
            configuration.GetValue("JwtSettings:RefreshTokenExpirationDays", 7)
        );

        // Store new refresh token with same family ID
        await refreshTokenService.StoreRefreshTokenAsync(user, newRefreshToken, refreshTokenExpiresAt, tokenFamilyId);

        // Revoke old refresh token
        await refreshTokenService.RevokeRefreshTokenAsync(user);

        // Set new cookies
        Response.Cookies.Append("accessToken", newAccessToken, GetCookieOptions(isRefreshToken: false));
        Response.Cookies.Append("refreshToken", newRefreshToken, GetCookieOptions(isRefreshToken: true));

        return Ok(new { message = "Token refreshed successfully" });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        // Try to get user from token if available, but don't require authentication
        // This makes logout idempotent - it works even if already logged out
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrEmpty(userId))
        {
            var user = await userManager.FindByIdAsync(userId);
            if (user != null)
            {
                await refreshTokenService.RevokeRefreshTokenAsync(user);
            }
        }
        else
        {
            // If no user from token, try to revoke refresh token from cookie
            var refreshToken = Request.Cookies["refreshToken"];
            if (!string.IsNullOrEmpty(refreshToken))
            {
                var (isValid, user, _) = await refreshTokenService.ValidateRefreshTokenAsync(refreshToken);
                if (isValid && user != null)
                {
                    await refreshTokenService.RevokeRefreshTokenAsync(user);
                }
            }
        }

        // Clear cookies (always clear, even if no user found)
        Response.Cookies.Delete("accessToken");
        Response.Cookies.Delete("refreshToken");

        return Ok(new { message = "Logout successful" });
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        try
        {
            // Check if user is authenticated (don't use [Authorize] to avoid 500 on validation errors)
            if (User.Identity?.IsAuthenticated != true)
            {
                // Try to get user from refresh token as fallback
                var refreshToken = Request.Cookies["refreshToken"];
                if (!string.IsNullOrEmpty(refreshToken))
                {
                    var (isValid, refreshTokenUser, _) = await refreshTokenService.ValidateRefreshTokenAsync(refreshToken);
                    if (isValid && refreshTokenUser is { IsActive: true })
                    {
                        // Generate new access token and return user
                        var newAccessToken = GenerateAccessToken(refreshTokenUser);
                        Response.Cookies.Append("accessToken", newAccessToken, GetCookieOptions(isRefreshToken: false));

                        return Ok(new UserDto
                        {
                            Id = refreshTokenUser.Id,
                            Email = refreshTokenUser.Email!,
                            FirstName = refreshTokenUser.FirstName,
                            LastName = refreshTokenUser.LastName
                        });
                    }
                }

                return Unauthorized(new { message = "Not authenticated" });
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            var user = await userManager.FindByIdAsync(userId);
            return user is null or { IsActive: false }
                ? Unauthorized(new { message = "User not found or inactive" })
                : Ok(new UserDto
                {
                    Id = user.Id,
                    Email = user.Email!,
                    FirstName = user.FirstName,
                    LastName = user.LastName
                });
        }
        catch (Exception)
        {
            // Log exception in production
            return StatusCode(500, new { message = "An error occurred while retrieving user information" });
        }
    }

    private string GenerateAccessToken(UserModel user)
    {
        var jwtSettings = configuration.GetSection("JwtSettings");
        var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
            ?? jwtSettings["SecretKey"];

        if (string.IsNullOrEmpty(secretKey))
        {
            throw new InvalidOperationException("JWT secret key not configured. Please set JWT_SECRET_KEY environment variable or JwtSettings:SecretKey in appsettings.json");
        }

        // Validate secret key length (minimum 32 bytes for HS256)
        if (Encoding.UTF8.GetByteCount(secretKey) < 32)
        {
            throw new InvalidOperationException("JWT secret key must be at least 32 bytes (256 bits) for HS256 algorithm");
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
            new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var expirationMinutes = configuration.GetValue("JwtSettings:AccessTokenExpirationMinutes", 15);
        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private CookieOptions GetCookieOptions(bool isRefreshToken = false)
    {
        var isDevelopment = configuration.GetValue<string>("ASPNETCORE_ENVIRONMENT") == "Development";
        var expirationMinutes = configuration.GetValue("JwtSettings:AccessTokenExpirationMinutes", 15);
        var expirationDays = configuration.GetValue("JwtSettings:RefreshTokenExpirationDays", 7);

        return new CookieOptions
        {
            HttpOnly = true,
            Secure = !isDevelopment, // Only secure in production (HTTPS)
            SameSite = isDevelopment ? SameSiteMode.Lax : SameSiteMode.None, // Lax for dev, None for cross-origin in prod
            Path = "/",
            MaxAge = isRefreshToken ? TimeSpan.FromDays(expirationDays) : TimeSpan.FromMinutes(expirationMinutes)
        };
    }
}

