using System.ComponentModel.DataAnnotations.Schema;

[Table("activity_ideas")]
public class ActivityIdea : IHasTimeStamps
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("name")]
    [MaxLength(100)]
    public required string Name { get; set; }

    [Column("description")]
    [MaxLength(1000)]
    public required string Description { get; set; }
}