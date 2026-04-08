using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Domino.Backend.Utilities;
using Domino.Backend.Application.ActivityIdeas.Models;

namespace Domino.Backend.Application.Matches.Models;

[Table("match_activity_ideas")]
public class MatchActivityIdeaModel : IHasTimeStamps
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
    public ActivityIdeaModel? ActivityIdea { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}