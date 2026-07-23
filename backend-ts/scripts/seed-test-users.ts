import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const SALT_ROUNDS = 12;

interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthday: Date;
  role: 'User' | 'Admin' | 'SuperDuperAdmin';
}

const testUsers: TestUser[] = [
  {
    email: 'admin@domino.test',
    password: 'Admin123!',
    firstName: 'Dana',
    lastName: 'Admin',
    birthday: new Date('1990-03-15'),
    role: 'Admin',
  },
  {
    email: 'superadmin@domino.test',
    password: 'Super123!',
    firstName: 'Sam',
    lastName: 'SuperAdmin',
    birthday: new Date('1988-07-22'),
    role: 'SuperDuperAdmin',
  },
  {
    email: 'alice@domino.test',
    password: 'Testing1!',
    firstName: 'Alice',
    lastName: 'Johnson',
    birthday: new Date('1995-01-10'),
    role: 'User',
  },
  {
    email: 'bob@domino.test',
    password: 'Testing1!',
    firstName: 'Bob',
    lastName: 'Martinez',
    birthday: new Date('1992-11-05'),
    role: 'User',
  },
  {
    email: 'carol@domino.test',
    password: 'Testing1!',
    firstName: 'Carol',
    lastName: 'Chen',
    birthday: new Date('1998-06-20'),
    role: 'User',
  },
  {
    email: 'dave@domino.test',
    password: 'Testing1!',
    firstName: 'Dave',
    lastName: 'Williams',
    birthday: new Date('1993-09-12'),
    role: 'User',
  },
];

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Seeding test users...\n');

    for (const u of testUsers) {
      const normalizedEmail = u.email.toUpperCase();
      const existing = await prisma.user.findFirst({
        where: { normalizedEmail },
      });

      if (existing) {
        console.log(`  ⏭  ${u.email} already exists (id=${existing.id}), skipping`);
        continue;
      }

      const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS);

      const role = await prisma.role.findUnique({
        where: { normalizedName: u.role.toUpperCase() },
      });

      if (!role) {
        console.error(`  ✗  Role "${u.role}" not found — run the app once first to seed roles.`);
        continue;
      }

      const user = await prisma.user.create({
        data: {
          firstName: u.firstName,
          lastName: u.lastName,
          birthday: u.birthday,
          email: u.email,
          normalizedEmail,
          userName: u.email,
          normalizedUserName: normalizedEmail,
          passwordHash,
          isActive: true,
          emailConfirmed: true,
          phoneNumberConfirmed: false,
          twoFactorEnabled: false,
          lockoutEnabled: true,
          accessFailedCount: 0,
          securityStamp: crypto.randomUUID(),
          concurrencyStamp: crypto.randomUUID(),
        },
      });

      await prisma.userRole.create({
        data: { userId: user.id, roleId: role.id },
      });

      console.log(`  ✓  Created ${u.firstName} ${u.lastName} <${u.email}> [${u.role}] (id=${user.id})`);
    }

    console.log('\nDone! Test users are ready.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
