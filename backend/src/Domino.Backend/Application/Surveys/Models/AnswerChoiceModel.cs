using System.ComponentModel.DataAnnotations.Schema;

namespace Domino.Backend.Application.Surveys.Models;

[Table("answer_choices")]
public class AnswerChoiceModel : AnswerModel
{
    [Column("selected_question_option_id")]
    public int SelectedQuestionOptionId { get; set; }

    [ForeignKey(nameof(SelectedQuestionOptionId))]
    public QuestionOptionModel? SelectedQuestionOption { get; set; }
}