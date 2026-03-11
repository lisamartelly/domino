using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Domino.Backend.Migrations;
/// <inheritdoc />
public partial class SeedRoles : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("INSERT INTO roles (name) VALUES ('SuperDuperAdmin'),('Admin'), ('User')");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("DELETE FROM roles WHERE name IN ('SuperDuperAdmin', 'Admin', 'User')");
    }
}
