using System.ComponentModel.DataAnnotations.Schema;
using Domino.Backend.Utilities;
using Domino.Backend.Application.Users;

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
}