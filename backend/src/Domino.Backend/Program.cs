using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Domino.Backend;
using Domino.Backend.Application.Users;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddControllers();

// Add Swagger services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add PostgreSQL services
builder.Services.AddDbContext<DominoDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add Identity Framework services
builder.Services.AddIdentity<UserModel, IdentityRole>()
    .AddEntityFrameworkStores<DominoDbContext>()
    .AddDefaultTokenProviders();

// Add RefreshTokenService
builder.Services.AddScoped<IRefreshTokenService, RefreshTokenService>();

// Configure Authentication with Cookie scheme
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
            ? CookieSecurePolicy.None
            : CookieSecurePolicy.Always;
        options.Cookie.SameSite = builder.Environment.IsDevelopment()
            ? SameSiteMode.Lax
            : SameSiteMode.None;
        options.Cookie.Path = "/";
        options.Events.OnValidatePrincipal = async context =>
        {
            var token = context.Request.Cookies["accessToken"];
            if (string.IsNullOrEmpty(token))
            {
                // No token in cookie - this is fine for endpoints that don't require auth
                // Don't reject, just leave principal as null
                return;
            }

            try
            {
                var jwtSettings = builder.Configuration.GetSection("JwtSettings");
                var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
                    ?? jwtSettings["SecretKey"];

                if (string.IsNullOrEmpty(secretKey))
                {
                    // Secret key not configured - can't validate, but don't reject
                    return;
                }

                var tokenHandler = new JwtSecurityTokenHandler();

                // Check if token is readable before trying to validate
                if (!tokenHandler.CanReadToken(token))
                {
                    return;
                }

                var key = Encoding.UTF8.GetBytes(secretKey);

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = jwtSettings["Issuer"],
                    ValidateAudience = true,
                    ValidAudience = jwtSettings["Audience"],
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                var principal = tokenHandler.ValidateToken(token, validationParameters, out _);

                // Verify user still exists and is active
                var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!string.IsNullOrEmpty(userId))
                {
                    using var scope = context.HttpContext.RequestServices.CreateScope();
                    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<UserModel>>();
                    var user = await userManager.FindByIdAsync(userId);

                    if (user == null || !user.IsActive)
                    {
                        // User doesn't exist or is inactive - reject
                        context.RejectPrincipal();
                        return;
                    }
                }

                context.Principal = principal;
                context.ShouldRenew = true;
            }
            catch (SecurityTokenExpiredException)
            {
                // Token expired - this is expected, don't reject (let refresh handle it)
                // Just return without setting principal - [Authorize] will return 401
            }
            catch (SecurityTokenException)
            {
                // Invalid token format or signature - reject
                context.RejectPrincipal();
            }
            catch (Exception)
            {
                // Other errors (database, etc.) - log in production, but don't crash
                // Reject principal to force re-authentication
                context.RejectPrincipal();
            }
        };
    });

// Configure Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("LoginPolicy", limiterOptions =>
    {
        limiterOptions.PermitLimit = 5;
        limiterOptions.Window = TimeSpan.FromMinutes(15);
        limiterOptions.QueueLimit = 2;
    });

    options.AddFixedWindowLimiter("RefreshPolicy", limiterOptions =>
    {
        limiterOptions.PermitLimit = 10;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueLimit = 2;
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Rate limiting
app.UseRateLimiter();

// Authentication and Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();
