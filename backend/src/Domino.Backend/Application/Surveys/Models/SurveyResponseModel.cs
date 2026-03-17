using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Domino.Backend.Utilities;
using Domino.Backend.Application.Users;

namespace Domino.Backend.Application.Surveys.Models;

[Table("survey_responses")]
public class SurveyResponseModel : IHasTimeStamps
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public UserModel? User { get; set; }

    [Column("survey_version_id")]
    public int SurveyVersionId { get; set; }

    [ForeignKey(nameof(SurveyVersionId))]
    public SurveyVersionModel? SurveyVersion { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}