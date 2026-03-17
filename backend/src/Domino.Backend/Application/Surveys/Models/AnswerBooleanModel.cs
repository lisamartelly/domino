using System.ComponentModel.DataAnnotations.Schema;

namespace Domino.Backend.Application.Surveys.Models;

[Table("answer_booleans")]
public class AnswerBooleanModel : AnswerModel
{
    [Column("value")]
    public bool Value { get; set; }
}