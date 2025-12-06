using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;


namespace Domino.Backend.Application.Users;

[Table("users")]
[PrimaryKey(nameof(Id))]
public class UserModel
{
    [Key]
    [Column("id")]
    public int Id { get; }

    [Column("email")]
    [MaxLength(100)]
    public required string Email { get; set; }

    [Column("first_name")]
    [MaxLength(100)]
    public required string FirstName { get; set; }

    [Column("last_name")]
    [MaxLength(100)]
    public required string LastName { get; set; }

    [Column("birthday")]
    public DateOnly Birthday { get; set; }

    [Column("is_active")]
    [DefaultValue(true)]
    public bool IsActive { get; set; } = true;

    [Column("role_id")]
    public int RoleId { get; set; }
    [ForeignKey("RoleId")]
    public required RoleModel Role { get; set; }
}

// things we need to check in this
// does the required word make the column non nullable
// does the id autoincrement on its own
// does isActive default to true with this