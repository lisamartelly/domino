import { MembersService } from './members.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MembersService', () => {
  let service: MembersService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      role: { findMany: jest.fn() },
      userRole: { findMany: jest.fn() },
      user: { findMany: jest.fn(), findFirst: jest.fn() },
      matchUser: { findMany: jest.fn() },
    } as unknown as jest.Mocked<PrismaService>;

    service = new MembersService(prisma);
  });

  describe('list', () => {
    it('should return members excluding admins and the current user', async () => {
      (prisma.role.findMany as jest.Mock).mockResolvedValue([{ id: 1 }]);
      (prisma.userRole.findMany as jest.Mock)
        .mockResolvedValueOnce([{ userId: 99 }]) // admin user IDs
        .mockResolvedValue([]);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        {
          id: 2,
          firstName: 'Bob',
          lastName: 'Brown',
          birthday: new Date('1992-08-20'),
        },
      ]);
      (prisma.matchUser.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.list(5);

      expect(result).toHaveLength(1);
      expect(result[0].firstName).toBe('Bob');
      expect(result[0].matchStats.totalMatches).toBe(0);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            id: { notIn: expect.arrayContaining([5, 99]) },
          }),
        }),
      );
    });

    it('should compute match stats for each member', async () => {
      (prisma.role.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.userRole.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        {
          id: 2,
          firstName: 'Bob',
          lastName: 'Brown',
          birthday: new Date('1992-08-20'),
        },
      ]);
      (prisma.matchUser.findMany as jest.Mock).mockResolvedValue([
        { userId: 2, accepted: true },
        { userId: 2, accepted: false },
        { userId: 2, accepted: null },
      ]);

      const result = await service.list(1);

      expect(result[0].matchStats).toEqual({
        totalMatches: 3,
        accepted: 1,
        denied: 1,
        pending: 1,
      });
    });
  });

  describe('getById', () => {
    it('should return null for inactive user', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.getById(999);

      expect(result).toBeNull();
    });

    it('should return member detail with match stats and past matches', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 2,
        firstName: 'Bob',
        lastName: 'Brown',
        birthday: new Date('1992-08-20'),
        isActive: true,
      });
      (prisma.matchUser.findMany as jest.Mock)
        .mockResolvedValueOnce([
          { accepted: true },
          { accepted: false },
        ])
        .mockResolvedValueOnce([
          {
            createdAt: new Date(),
            match: {
              publicId: 'xyz789',
              matchUsers: [
                {
                  user: { firstName: 'Alice', lastName: 'Anderson' },
                },
              ],
            },
          },
        ]);

      const result = await service.getById(2);

      expect(result).not.toBeNull();
      expect(result!.matchStats.totalMatches).toBe(2);
      expect(result!.matchStats.accepted).toBe(1);
      expect(result!.matchStats.denied).toBe(1);
      expect(result!.pastMatches).toHaveLength(1);
      expect(result!.pastMatches[0].otherUserName).toBe('Alice A.');
    });

    it('should show Unknown when other user is missing in past matches', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 2,
        firstName: 'Bob',
        lastName: 'Brown',
        birthday: new Date('1992-08-20'),
        isActive: true,
      });
      (prisma.matchUser.findMany as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            createdAt: new Date(),
            accepted: null,
            match: {
              publicId: 'xyz789',
              matchUsers: [],
            },
          },
        ]);

      const result = await service.getById(2);

      expect(result!.pastMatches[0].otherUserName).toBe('Unknown');
    });
  });
});
