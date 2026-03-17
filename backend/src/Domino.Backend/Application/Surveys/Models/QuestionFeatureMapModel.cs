using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Domino.Backend.Utilities;

namespace Domino.Backend.Application.Surveys.Models;

[Table("question_feature_maps")]
public class QuestionFeatureMapModel : IHasTimeStamps
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("question_version_id")]
    public int QuestionVersionId { get; set; }

    [ForeignKey(nameof(QuestionVersionId))]
    public QuestionVersionModel? QuestionVersion { get; set; }

    [Column("feature_id")]
    public int FeatureId { get; set; }

    [ForeignKey(nameof(FeatureId))]
    public FeatureModel? Feature { get; set; }

    [Column("transform_json")]
    public required string TransformJson { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}