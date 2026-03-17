namespace Domino.Backend.Utilities;

public interface IHasTimeStamps
{
    DateTime CreatedAt { get; set; }
    DateTime UpdatedAt { get; set; }
}