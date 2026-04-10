using System.ComponentModel.DataAnnotations.Schema;
using Domino.Backend.Utilities;
using System.ComponentModel.DataAnnotations;

namespace Domino.Backend.Application.ActivityIdeas.Models;

[Table("activity_ideas")]
public class ActivityIdeaModel : IHasTimeStamps
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("name")]
    [MaxLength(100)]
    public required string Name { get; set; }

    [Column("description")]
    [MaxLength(1000)]
    public required string Description { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}