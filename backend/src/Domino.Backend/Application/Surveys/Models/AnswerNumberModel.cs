using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domino.Backend.Application.Surveys.Models;

[Table("answer_numbers")]
public class AnswerNumberModel : AnswerModel
{
    [Column("value", TypeName = "decimal(10, 4)")]
    public decimal Value { get; set; }
}