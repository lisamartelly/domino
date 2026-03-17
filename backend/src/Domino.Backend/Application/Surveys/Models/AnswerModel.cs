using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Domino.Backend.Utilities;

namespace Domino.Backend.Application.Surveys.Models;

[Table("answers")]
public abstract class AnswerModel : IHasTimeStamps
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("survey_response_id")]
    public int SurveyResponseId { get; set; }

    [ForeignKey(nameof(SurveyResponseId))]
    public SurveyResponseModel? SurveyResponse { get; set; }

    [Column("question_version_id")]
    public int QuestionVersionId { get; set; }
    
    [ForeignKey(nameof(QuestionVersionId))]
    public QuestionVersionModel? QuestionVersion { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

}