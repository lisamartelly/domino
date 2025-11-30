using Microsoft.EntityFrameworkCore;

namespace Domino.Backend;

public class DominoDbContext(DbContextOptions<DominoDbContext> options) : DbContext(options);
