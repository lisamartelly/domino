using Domino.Backend.Application.Users;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Domino.Backend;

public class DominoDbContext(DbContextOptions<DominoDbContext> options) : IdentityDbContext<UserModel>(options)
{
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
        builder.Entity<IdentityRole>(entity =>
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
        builder.Entity<IdentityUserRole<string>>(entity =>
        {
            entity.ToTable("user_roles");

            entity.Property(e => e.UserId)
                .HasColumnName("user_id");
            entity.Property(e => e.RoleId)
                .HasColumnName("role_id");
        });

        // Configure IdentityUserClaim columns to use snake_case
        builder.Entity<IdentityUserClaim<string>>(entity =>
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
        builder.Entity<IdentityUserLogin<string>>(entity =>
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
        builder.Entity<IdentityUserToken<string>>(entity =>
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
        builder.Entity<IdentityRoleClaim<string>>(entity =>
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
    }
}
