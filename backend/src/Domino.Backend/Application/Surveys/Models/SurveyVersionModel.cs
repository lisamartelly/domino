using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Domino.Backend.Utilities;

namespace Domino.Backend.Application.Surveys.Models;

[Table("survey_versions")]
public class SurveyVersionModel : IHasTimeStamps
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("survey_id")]
    public int SurveyId { get; set; }

    [ForeignKey(nameof(SurveyId))]
    public SurveyModel? Survey { get; set; }

    [Column("version_number")]
    public int Version { get; set; }

    [Column("published_at")]
    public DateTime? PublishedAt { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}