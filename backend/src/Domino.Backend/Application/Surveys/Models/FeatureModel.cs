using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Domino.Backend.Utilities;
using Microsoft.EntityFrameworkCore;

namespace Domino.Backend.Application.Surveys.Models;

[Table("features")]
public class FeatureModel : IHasTimeStamps
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("name")]
    [MaxLength(100)]
    public required string Name { get; set; }

    [Column("description")]
    [MaxLength(100)]
    public required string Description { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}