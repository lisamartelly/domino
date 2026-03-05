using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;

namespace Domino.Backend.Application.Users;

[ApiController]
[Route("api/[controller]")]
public class AuthController(UserManager<UserModel> userManager, RefreshTokenService refreshTokenService, IConfiguration configuration) : ControllerBase
{

    [HttpPost("register")]
    [EnableRateLimiting("RegisterPolicy")]
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

            var passwordValid = await userManager.CheckPasswordAsync(user, request.Password);
            if (!passwordValid)
            {
                _ =await userManager.AccessFailedAsync(user);
                return Unauthorized(new LoginResponse
                {
                    Success = false,
                    Message = "Invalid email or password"
                });
            }

            _ = await userManager.ResetAccessFailedCountAsync(user);

            var accessToken = GenerateAccessToken(user);

            // Generate refresh token
            var refreshToken = refreshTokenService.GenerateRefreshToken();
            var refreshTokenExpiresAt = DateTime.UtcNow.AddDays(
                configuration.GetValue<int>("JwtSettings:RefreshTokenExpirationDays", 7)
            );

            // Store refresh token
            await refreshTokenService.StoreRefreshTokenAsync(user, refreshToken, refreshTokenExpiresAt);

            Response.Cookies.Append("refreshToken", $"{user.Id}:{refreshToken}", GetRefreshTokenCookieOptions());

            // Return access token in response body (stored in memory by frontend)
            return Ok(new LoginResponse
            {
                Success = true,
                Message = "Login successful",
                AccessToken = accessToken,
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email!,
                    FirstName = user.FirstName,
                    LastName = user.LastName
                }
            });
        }
        catch (InvalidOperationException)
        {
            // JWT configuration error
            return StatusCode(500, new LoginResponse
            {
                Success = false,
                Message = "An error occurred during authentication. Please try again later."
            });
        }
        catch (Exception)
        {
            // Log the exception (in production, use proper logging)
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
        var refreshCookie = Request.Cookies["refreshToken"];
        if (string.IsNullOrEmpty(refreshCookie))
        {
            return Unauthorized(new { message = "Refresh token not found" });
        }

        // Cookie format: "userId:token"
        var separatorIndex = refreshCookie.IndexOf(':');
        if (separatorIndex < 1)
        {
            return Unauthorized(new { message = "Invalid refresh token format" });
        }

        var userId = refreshCookie[..separatorIndex];
        var refreshToken = refreshCookie[(separatorIndex + 1)..];

        var (isValid, user, tokenFamilyId) = await refreshTokenService.ValidateRefreshTokenAsync(refreshToken, userId);
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
            configuration.GetValue<int>("JwtSettings:RefreshTokenExpirationDays", 7)
        );

        // Store new refresh token (overwrites old one via Identity's SetAuthenticationTokenAsync)
        await refreshTokenService.StoreRefreshTokenAsync(user, newRefreshToken, refreshTokenExpiresAt, tokenFamilyId);

        Response.Cookies.Append("refreshToken", $"{user.Id}:{newRefreshToken}", GetRefreshTokenCookieOptions());

        // Return new access token in response body
        return Ok(new { message = "Token refreshed successfully", accessToken = newAccessToken });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        // Try to revoke via the refresh token cookie
        var refreshCookie = Request.Cookies["refreshToken"];
        if (!string.IsNullOrEmpty(refreshCookie))
        {
            var separatorIndex = refreshCookie.IndexOf(':');
            if (separatorIndex > 0)
            {
                var userId = refreshCookie[..separatorIndex];
                var user = await userManager.FindByIdAsync(userId);
                if (user != null)
                {
                    await refreshTokenService.RevokeRefreshTokenAsync(user);
                }
            }
        }

        Response.Cookies.Delete("refreshToken", new CookieOptions { Path = "/api/auth" });

        return Ok(new { message = "Logout successful" });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (userId is null)
        {
            return Unauthorized(new { message = "Invalid token" });
        }

        var user = await userManager.FindByIdAsync(userId);
        if (user is not { IsActive: true })
        {
            return Unauthorized(new { message = "User not found or inactive" });
        }

        return Ok(new UserDto
        {
            Id = user.Id,
            Email = user.Email!,
            FirstName = user.FirstName,
            LastName = user.LastName
        });
    }

    private string GenerateAccessToken(UserModel user)
    {
        var jwtSettings = configuration.GetSection("JwtSettings");
        var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") 
            ?? jwtSettings["SecretKey"]
            ?? throw new InvalidOperationException("JWT secret key not configured. Please set JWT_SECRET_KEY environment variable or JwtSettings:SecretKey in appsettings.json");
        
        // Validate secret key length (minimum 32 bytes for HS256)
        if (secretKey.Length < 32)
        {
            throw new InvalidOperationException("JWT secret key must be at least 32 bytes (256 bits) for HS256 algorithm");
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}")
        };

        var expirationMinutes = configuration.GetValue<int>("JwtSettings:AccessTokenExpirationMinutes", 15);
        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private CookieOptions GetRefreshTokenCookieOptions()
    {
        var isDevelopment = configuration.GetValue<string>("ASPNETCORE_ENVIRONMENT") == "Development" 
            || Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";
        var expirationDays = configuration.GetValue<int>("JwtSettings:RefreshTokenExpirationDays", 7);
        
        return new CookieOptions
        {
            HttpOnly = true,
            Secure = !isDevelopment,
            SameSite = isDevelopment ? SameSiteMode.Lax : SameSiteMode.None,
            Path = "/api/auth",
            MaxAge = TimeSpan.FromDays(expirationDays)
        };
    }
}

