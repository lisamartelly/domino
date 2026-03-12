using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Domino.Backend.Utilities;

namespace Domino.Backend.Application.Surveys.Models;

[Table("question_options")]
public class QuestionOptionModel : IHasTimeStamps
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("question_version_id")]
    public int QuestionVersionId { get; set; }

    [ForeignKey(nameof(QuestionVersionId))]
    public QuestionVersionModel? QuestionVersion { get; set; }

    [Column("value")]
    [MaxLength(1000)]
    public required string Value { get; set; }

    [Column("display_value")]
    [MaxLength(1000)]
    public required string DisplayValue { get; set; }

    [Column("sort_order")]
    public int SortOrder { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}