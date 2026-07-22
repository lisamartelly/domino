import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://user:password@localhost:5433/domino?schema=public',
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed roles (matching .NET SeedRoles migration)
  const roles = ['SuperDuperAdmin', 'Admin', 'User'];

  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { normalizedName: roleName.toUpperCase() },
      update: {},
      create: {
        name: roleName,
        normalizedName: roleName.toUpperCase(),
      },
    });
  }

  console.log('Seeded roles:', roles);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
