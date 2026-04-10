using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Domino.Backend;
using Domino.Backend.Application.ActivityIdeas;
using Domino.Backend.Application.Matches;
using Domino.Backend.Application.Members;
using Domino.Backend.Application.Users;
using Domino.Backend.Utilities;
using Microsoft.AspNetCore.Authentication.JwtBearer;
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

// Add TimestampInterceptor
builder.Services.AddSingleton<TimestampInterceptor>();

// Add PostgreSQL services
builder.Services.AddDbContext<DominoDbContext>((sp, options) =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
        .AddInterceptors(sp.GetRequiredService<TimestampInterceptor>()));

// Add Identity Framework services
builder.Services.AddIdentity<UserModel, IdentityRole<int>>()
    .AddEntityFrameworkStores<DominoDbContext>()
    .AddDefaultTokenProviders();

// Add application services
builder.Services.AddScoped<RefreshTokenService>();
builder.Services.AddScoped<IActivityIdeasService, ActivityIdeasService>();
builder.Services.AddScoped<IMembersService, MembersService>();
builder.Services.AddScoped<IMatchesService, MatchesService>();

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") 
    ?? jwtSettings["SecretKey"] 
    ?? throw new InvalidOperationException("JWT secret key not configured");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.MapInboundClaims = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero,
        NameClaimType = JwtRegisteredClaimNames.Sub,
        RoleClaimType = System.Security.Claims.ClaimTypes.Role
    };
});

// Configure CORS
var allowedOrigins = builder.Environment.IsDevelopment()
    ? ["http://localhost:5173"] // Vite dev server
    : builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
        ?? [];

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
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

    options.AddFixedWindowLimiter("RegisterPolicy", limiterOptions =>
    {
        limiterOptions.PermitLimit = 5;
        limiterOptions.Window = TimeSpan.FromMinutes(30);
        limiterOptions.QueueLimit = 0;
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

if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// CORS must come before authentication
app.UseCors("AllowFrontend");

// Rate limiting
app.UseRateLimiter();

// Authentication and Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

if (app.Environment.IsProduction())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<DominoDbContext>();
    db.Database.Migrate();
}

await SeedActivityIdeasAsync(app);

app.Run();

static async Task SeedActivityIdeasAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<DominoDbContext>();

    if (await db.ActivityIdeas.AnyAsync())
    {
        return;
    }

    db.ActivityIdeas.AddRange(
        new Domino.Backend.Application.ActivityIdeas.Models.ActivityIdeaModel { Name = "Coffee walk", Description = "Grab coffee and stroll around a lake or park." },
        new Domino.Backend.Application.ActivityIdeas.Models.ActivityIdeaModel { Name = "Board game night", Description = "Meet at a board game café for a low-pressure evening." },
        new Domino.Backend.Application.ActivityIdeas.Models.ActivityIdeaModel { Name = "Cooking class", Description = "Take an intro cooking class together." },
        new Domino.Backend.Application.ActivityIdeas.Models.ActivityIdeaModel { Name = "Museum visit", Description = "Explore a local museum or art gallery." },
        new Domino.Backend.Application.ActivityIdeas.Models.ActivityIdeaModel { Name = "Trivia night", Description = "Team up at a bar trivia event." },
        new Domino.Backend.Application.ActivityIdeas.Models.ActivityIdeaModel { Name = "Farmers market", Description = "Browse a weekend farmers market together." },
        new Domino.Backend.Application.ActivityIdeas.Models.ActivityIdeaModel { Name = "Outdoor hike", Description = "Hit a nearby trail for a casual hike." },
        new Domino.Backend.Application.ActivityIdeas.Models.ActivityIdeaModel { Name = "Live music", Description = "Catch a local band or open mic night." },
        new Domino.Backend.Application.ActivityIdeas.Models.ActivityIdeaModel { Name = "Picnic in the park", Description = "Pack snacks and enjoy a picnic." },
        new Domino.Backend.Application.ActivityIdeas.Models.ActivityIdeaModel { Name = "Pottery class", Description = "Try a one-time pottery or ceramics workshop." },
        new Domino.Backend.Application.ActivityIdeas.Models.ActivityIdeaModel { Name = "Escape room", Description = "Work together to solve an escape room." },
        new Domino.Backend.Application.ActivityIdeas.Models.ActivityIdeaModel { Name = "Food truck hop", Description = "Sample food from different trucks around town." }
    );

    await db.SaveChangesAsync();
}
