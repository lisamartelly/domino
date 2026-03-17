using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Domino.Backend.Utilities;

namespace Domino.Backend.Application.Surveys.Models;

[Table("questions")]
public class QuestionModel : IHasTimeStamps
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("stable_key")]
    [MaxLength(100)]
    public required string StableKey { get; set; }

    [Column("question_group")]
    [MaxLength(100)]
    public string? QuestionGroup { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
