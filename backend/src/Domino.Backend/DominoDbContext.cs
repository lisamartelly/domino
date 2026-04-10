# pragma warning disable IDE0058
using Domino.Backend.Application.Users;
using Domino.Backend.Application.Surveys.Models;
using Domino.Backend.Application.ActivityIdeas.Models;
using Domino.Backend.Application.Matches.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Domino.Backend;

public class DominoDbContext(DbContextOptions<DominoDbContext> options) : IdentityDbContext<UserModel, IdentityRole<int>, int>(options)
{
    public DbSet<SurveyModel> Surveys => Set<SurveyModel>();
    public DbSet<ActivityIdeaModel> ActivityIdeas => Set<ActivityIdeaModel>();
    public DbSet<MatchModel> Matches => Set<MatchModel>();
    public DbSet<MatchUserModel> MatchUsers => Set<MatchUserModel>();
    public DbSet<MatchActivityIdeaModel> MatchActivityIdeas => Set<MatchActivityIdeaModel>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure UserModel columns to use snake_case
        builder.Entity<UserModel>(entity =>
        {
            entity.ToTable("users");
            
            // IdentityUser properties
            entity.Property(e => e.Id)
                .HasColumnName("id");
            entity.Property(e => e.UserName)
                .HasColumnName("user_name");
            entity.Property(e => e.NormalizedUserName)
                .HasColumnName("normalized_user_name");
            entity.Property(e => e.Email)
                .HasColumnName("email");
            entity.Property(e => e.NormalizedEmail)
                .HasColumnName("normalized_email");
            entity.Property(e => e.EmailConfirmed)
                .HasColumnName("email_confirmed");
            entity.Property(e => e.PasswordHash)
                .HasColumnName("password_hash");
            entity.Property(e => e.SecurityStamp)
                .HasColumnName("security_stamp");
            entity.Property(e => e.ConcurrencyStamp)
                .HasColumnName("concurrency_stamp");
            entity.Property(e => e.PhoneNumber)
                .HasColumnName("phone_number");
            entity.Property(e => e.PhoneNumberConfirmed)
                .HasColumnName("phone_number_confirmed");
            entity.Property(e => e.TwoFactorEnabled)
                .HasColumnName("two_factor_enabled");
            entity.Property(e => e.LockoutEnd)
                .HasColumnName("lockout_end");
            entity.Property(e => e.LockoutEnabled)
                .HasColumnName("lockout_enabled");
            entity.Property(e => e.AccessFailedCount)
                .HasColumnName("access_failed_count");
        });

        // Configure IdentityRole columns to use snake_case
        builder.Entity<IdentityRole<int>>(entity =>
        {
            entity.ToTable("roles");
            
            entity.Property(e => e.Id)
                .HasColumnName("id");
            entity.Property(e => e.Name)
                .HasColumnName("name");
            entity.Property(e => e.NormalizedName)
                .HasColumnName("normalized_name");
            entity.Property(e => e.ConcurrencyStamp)
                .HasColumnName("concurrency_stamp");
        });

        // Configure IdentityUserRole columns to use snake_case
        builder.Entity<IdentityUserRole<int>>(entity =>
        {
            entity.ToTable("user_roles");
            
            entity.Property(e => e.UserId)
                .HasColumnName("user_id");
            entity.Property(e => e.RoleId)
                .HasColumnName("role_id");
        });

        // Configure IdentityUserClaim columns to use snake_case
        builder.Entity<IdentityUserClaim<int>>(entity =>
        {
            entity.ToTable("user_claims");
            
            entity.Property(e => e.Id)
                .HasColumnName("id");
            entity.Property(e => e.UserId)
                .HasColumnName("user_id");
            entity.Property(e => e.ClaimType)
                .HasColumnName("claim_type");
            entity.Property(e => e.ClaimValue)
                .HasColumnName("claim_value");
        });

        // Configure IdentityUserLogin columns to use snake_case
        builder.Entity<IdentityUserLogin<int>>(entity =>
        {
            entity.ToTable("user_logins");
            
            entity.Property(e => e.LoginProvider)
                .HasColumnName("login_provider");
            entity.Property(e => e.ProviderKey)
                .HasColumnName("provider_key");
            entity.Property(e => e.ProviderDisplayName)
                .HasColumnName("provider_display_name");
            entity.Property(e => e.UserId)
                .HasColumnName("user_id");
        });

        // Configure IdentityUserToken columns to use snake_case
        builder.Entity<IdentityUserToken<int>>(entity =>
        {
            entity.ToTable("user_tokens");
            
            entity.Property(e => e.UserId)
                .HasColumnName("user_id");
            entity.Property(e => e.LoginProvider)
                .HasColumnName("login_provider");
            entity.Property(e => e.Name)
                .HasColumnName("name");
            entity.Property(e => e.Value)
                .HasColumnName("value");
        });

        // Configure IdentityRoleClaim columns to use snake_case
        builder.Entity<IdentityRoleClaim<int>>(entity =>
        {
            entity.ToTable("role_claims");
            
            entity.Property(e => e.Id)
                .HasColumnName("id");
            entity.Property(e => e.RoleId)
                .HasColumnName("role_id");
            entity.Property(e => e.ClaimType)
                .HasColumnName("claim_type");
            entity.Property(e => e.ClaimValue)
                .HasColumnName("claim_value");
        });

        builder.Entity<SurveyVersionModel>(entity =>
        {
            entity.HasIndex(sv => sv.SurveyId)
            .IsUnique()
            .HasFilter($"is_active = TRUE AND published_at IS NOT NULL");
        });

        builder.Entity<QuestionVersionModel>(entity =>
        {
            entity.Property(e => e.QuestionType)
                .HasConversion<string>()
                .HasMaxLength(255);
        });

        builder.Entity<AnswerModel>().UseTptMappingStrategy();
        builder.Entity<AnswerTextModel>();
        builder.Entity<AnswerNumberModel>();
        builder.Entity<AnswerBooleanModel>();
        builder.Entity<AnswerChoiceModel>();
    }
}
