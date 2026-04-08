using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Domino.Backend.Utilities;
using Domino.Backend.Application.Users;

namespace Domino.Backend.Application.Matches.Models;

[Table("matches")]
public class MatchModel : IHasTimeStamps
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("created_by_user_id")]
    public int CreatedByUserId { get; set; }

    [ForeignKey(nameof(CreatedByUserId))]
    public UserModel? CreatedByUser { get; set; }

    public ICollection<MatchActivityIdeaModel> MatchActivityIdeas { get; set; } = [];

    [Column("created_at")]  
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}