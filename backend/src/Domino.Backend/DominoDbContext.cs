using Domino.Backend.Application.Users;
using Microsoft.EntityFrameworkCore;

namespace Domino.Backend;

public class DominoDbContext(DbContextOptions<DominoDbContext> options) : DbContext(options)
{
    public DbSet<UserModel> Users => Set<UserModel>();
    public DbSet<RoleModel> Roles => Set<RoleModel>();

}
