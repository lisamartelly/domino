using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Domino.Backend;
using Domino.Backend.Application.ActivityIdeas;
using Domino.Backend.Application.Matches;
using Domino.Backend.Application.Members;
using Domino.Backend.Application.Surveys;
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
builder.Services.AddScoped<ISurveysService, SurveysService>();

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
await SeedIntakeSurveyAsync(app);

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

static async Task SeedIntakeSurveyAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<DominoDbContext>();

    if (await db.Surveys.AnyAsync(s => s.Slug == "intake"))
    {
        return;
    }

    var survey = new Domino.Backend.Application.Surveys.Models.SurveyModel
    {
        Name = "Intake",
        Slug = "intake",
        Description = "Help us get to know you so we can find your best matches."
    };

    db.Surveys.Add(survey);
    await db.SaveChangesAsync();

    var version = new Domino.Backend.Application.Surveys.Models.SurveyVersionModel
    {
        SurveyId = survey.Id,
        Version = 1,
        IsActive = true,
        PublishedAt = DateTime.UtcNow
    };

    db.Set<Domino.Backend.Application.Surveys.Models.SurveyVersionModel>().Add(version);
    await db.SaveChangesAsync();

    var questions = new[]
    {
        new { StableKey = "about_you", Group = (string?)"About You", Prompt = "Tell us a little about yourself.", Type = Domino.Backend.Application.Surveys.Enums.QuestionType.Text, Required = true },
        new { StableKey = "gender", Group = (string?)"Preferences", Prompt = "What gender do you identify as?", Type = Domino.Backend.Application.Surveys.Enums.QuestionType.SingleChoice, Required = true },
        new { StableKey = "gender_preference", Group = (string?)"Preferences", Prompt = "What gender do you prefer to be matched with?", Type = Domino.Backend.Application.Surveys.Enums.QuestionType.SingleChoice, Required = true },
        new { StableKey = "interests", Group = (string?)"Preferences", Prompt = "Which activities interest you? (select all that apply)", Type = Domino.Backend.Application.Surveys.Enums.QuestionType.MultipleChoice, Required = true },
        new { StableKey = "availability", Group = (string?)"Logistics", Prompt = "When are you usually free to hang out?", Type = Domino.Backend.Application.Surveys.Enums.QuestionType.MultipleChoice, Required = true },
        new { StableKey = "anything_else", Group = (string?)"Logistics", Prompt = "Anything else you'd like us to know?", Type = Domino.Backend.Application.Surveys.Enums.QuestionType.Text, Required = false },
    };

    foreach (var q in questions)
    {
        var question = new Domino.Backend.Application.Surveys.Models.QuestionModel
        {
            StableKey = q.StableKey,
            QuestionGroup = q.Group
        };

        db.Set<Domino.Backend.Application.Surveys.Models.QuestionModel>().Add(question);
        await db.SaveChangesAsync();

        var qv = new Domino.Backend.Application.Surveys.Models.QuestionVersionModel
        {
            QuestionId = question.Id,
            SurveyVersionId = version.Id,
            VersionNumber = 1,
            Prompt = q.Prompt,
            QuestionType = q.Type,
            Required = q.Required
        };

        db.Set<Domino.Backend.Application.Surveys.Models.QuestionVersionModel>().Add(qv);
        await db.SaveChangesAsync();

        if (q.StableKey == "gender")
        {
            var options = new[] { ("male", "Male"), ("female", "Female"), ("non-binary", "Non-binary"), ("other", "Other") };
            for (int i = 0; i < options.Length; i++)
            {
                db.Set<Domino.Backend.Application.Surveys.Models.QuestionOptionModel>().Add(
                    new Domino.Backend.Application.Surveys.Models.QuestionOptionModel
                    {
                        QuestionVersionId = qv.Id,
                        Value = options[i].Item1,
                        DisplayValue = options[i].Item2,
                        SortOrder = i
                    });
            }
            await db.SaveChangesAsync();
        }
        else if (q.StableKey == "interests")
        {
            var options = new[] { "Outdoor activities", "Food & drinks", "Arts & culture", "Sports & fitness", "Board games & trivia", "Live music & events" };
            for (int i = 0; i < options.Length; i++)
            {
                db.Set<Domino.Backend.Application.Surveys.Models.QuestionOptionModel>().Add(
                    new Domino.Backend.Application.Surveys.Models.QuestionOptionModel
                    {
                        QuestionVersionId = qv.Id,
                        Value = options[i].ToLowerInvariant().Replace(" & ", "-").Replace(" ", "-"),
                        DisplayValue = options[i],
                        SortOrder = i
                    });
            }
            await db.SaveChangesAsync();
        }
        else if (q.StableKey == "availability")
        {
            var options = new[] { "Weekday mornings", "Weekday evenings", "Weekend mornings", "Weekend afternoons", "Weekend evenings" };
            for (int i = 0; i < options.Length; i++)
            {
                db.Set<Domino.Backend.Application.Surveys.Models.QuestionOptionModel>().Add(
                    new Domino.Backend.Application.Surveys.Models.QuestionOptionModel
                    {
                        QuestionVersionId = qv.Id,
                        Value = options[i].ToLowerInvariant().Replace(" ", "-"),
                        DisplayValue = options[i],
                        SortOrder = i
                    });
            }
            await db.SaveChangesAsync();
        }
        else if (q.StableKey == "gender_preference")
        {
            var options = new[] { ("male", "Male"), ("female", "Female"), ("no-preference", "No preference") };
            for (int i = 0; i < options.Length; i++)
            {
                db.Set<Domino.Backend.Application.Surveys.Models.QuestionOptionModel>().Add(
                    new Domino.Backend.Application.Surveys.Models.QuestionOptionModel
                    {
                        QuestionVersionId = qv.Id,
                        Value = options[i].Item1,
                        DisplayValue = options[i].Item2,
                        SortOrder = i
                    });
            }
            await db.SaveChangesAsync();
        }
    }
}
