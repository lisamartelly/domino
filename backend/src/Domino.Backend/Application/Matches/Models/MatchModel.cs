using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using Domino.Backend.Utilities;
using Domino.Backend.Application.Users;
using Microsoft.EntityFrameworkCore;

namespace Domino.Backend.Application.Matches.Models;

[Table("matches")]
[Index(nameof(PublicId), Name = "idx_match_public_id", IsUnique = true)]
public class MatchModel : IHasTimeStamps
{
    private static readonly char[] Alphabet =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".ToCharArray();

    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("public_id")]
    [MaxLength(10)]
    public string PublicId { get; set; } = RandomNumberGenerator.GetString(Alphabet, 10);

    [Column("narrative")]
    [MaxLength(1000)]
    public required string Narrative { get; set; }

    [Column("created_by_user_id")]
    public int CreatedByUserId { get; set; }

    [ForeignKey(nameof(CreatedByUserId))]
    public UserModel? CreatedByUser { get; set; }

    public ICollection<MatchActivityIdeaModel> MatchActivityIdeas { get; set; } = [];
    public ICollection<MatchUserModel> MatchUsers { get; set; } = [];

    [Column("created_at")]  
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}