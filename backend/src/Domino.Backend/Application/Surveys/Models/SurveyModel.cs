using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Domino.Backend.Utilities;
namespace Domino.Backend.Application.Surveys.Models;

[Table("surveys")]
public class SurveyModel : IHasTimeStamps
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("name")]
    [MaxLength(255)]
    public required string Name { get; set; }

    [Column("description")]
    [MaxLength(255)]
    public required string Description { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}