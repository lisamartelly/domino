using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;


namespace Domino.Backend.Application.Users;

[Table("users")]
[PrimaryKey(nameof(Id))]
public class UserModel : IdentityUser
{
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

}
