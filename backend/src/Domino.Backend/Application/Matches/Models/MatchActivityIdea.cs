using System.ComponentModel.DataAnnotations.Schema;
using Domino.Backend.Utilities;
using Domino.Backend.Application.ActivityIdeas;

[Table("match_activity_ideas")]
public class MatchActivityIdea : IHasTimeStamps
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("match_id")]
    public int MatchId { get; set; }

    [ForeignKey(nameof(MatchId))]
    public MatchModel? Match { get; set; }

    [Column("activity_idea_id")]
    public int ActivityIdeaId { get; set; }

    [ForeignKey(nameof(ActivityIdeaId))]
    public ActivityIdea? ActivityIdea { get; set; }
}