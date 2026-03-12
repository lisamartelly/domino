using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Domino.Backend.Application.Surveys.Models;

[Table("answer_texts")]
public class AnswerTextModel : AnswerModel
{
    [Column("value")]
    [MaxLength(1000)]
    public required string Value { get; set; }
}