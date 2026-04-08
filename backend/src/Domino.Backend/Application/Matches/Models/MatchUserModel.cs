using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Domino.Backend.Utilities;
using Domino.Backend.Application.Users;

namespace Domino.Backend.Application.Matches.Models;

[Table("match_users")]
public class MatchUserModel : IHasTimeStamps
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("match_id")]
    public int MatchId { get; set; }

    [ForeignKey(nameof(MatchId))]
    public MatchModel? Match { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public UserModel? User { get; set; }

    [Column("accepted")]
    public bool? Accepted { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}