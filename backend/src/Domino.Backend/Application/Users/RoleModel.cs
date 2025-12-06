using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Domino.Backend.Application.Users;

[Table("roles")]
[PrimaryKey(nameof(Id))]
public class RoleModel
{
    [Key]
    [Column("id")]
    public int Id { get; }

    [Column("name")]
    [MaxLength(100)]
    public required string Name { get; set; }
}