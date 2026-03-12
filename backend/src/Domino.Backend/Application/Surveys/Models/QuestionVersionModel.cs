using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Domino.Backend.Utilities;
using Domino.Backend.Application.Surveys.Enums;

namespace Domino.Backend.Application.Surveys.Models;

[Table("question_versions")]
public class QuestionVersionModel : IHasTimeStamps
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("question_id")]
    public int QuestionId { get; set; }

    [ForeignKey(nameof(QuestionId))]
    public QuestionModel? Question { get; set; }

    [Column("survey_version_id")]
    public int SurveyVersionId { get; set; }

    [ForeignKey(nameof(SurveyVersionId))]
    public SurveyVersionModel? SurveyVersion { get; set; }

    [Column("version_number")]
    public int VersionNumber { get; set; }
    
    [Column("prompt")]
    [MaxLength(1000)]
    public required string Prompt { get; set; }

    [Column("question_type")]
    public QuestionType QuestionType { get; set; }

    [Column("required")]
    public bool Required { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }   
}
