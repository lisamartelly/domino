import { MatchesService } from './matches.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MatchesService', () => {
  let service: MatchesService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      matchUser: {
        findMany: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
      },
      match: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      matchActivityIdea: {
        createMany: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
      activityIdea: {
        count: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    service = new MatchesService(prisma);
  });

  describe('listForUser', () => {
    it('should return match summaries with other user names', async () => {
      (prisma.matchUser.findMany as jest.Mock).mockResolvedValue([
        {
          userId: 1,
          match: {
            publicId: 'abc123',
            createdAt: new Date(),
            matchUsers: [
              { userId: 1, accepted: null, user: { firstName: 'Alice', lastName: 'Anderson' } },
              { userId: 2, accepted: null, user: { firstName: 'Bob', lastName: 'Brown' } },
            ],
          },
        },
      ]);

      const result = await service.listForUser(1);

      expect(result).toHaveLength(1);
      expect(result[0].publicId).toBe('abc123');
      expect(result[0].otherUserName).toBe('Bob B.');
      expect(result[0].status).toBe('pending');
    });

    it('should show accepted status when both users accept', async () => {
      (prisma.matchUser.findMany as jest.Mock).mockResolvedValue([
        {
          userId: 1,
          match: {
            publicId: 'abc123',
            createdAt: new Date(),
            matchUsers: [
              { userId: 1, accepted: true, user: { firstName: 'Alice', lastName: 'Anderson' } },
              { userId: 2, accepted: true, user: { firstName: 'Bob', lastName: 'Brown' } },
            ],
          },
        },
      ]);

      const result = await service.listForUser(1);

      expect(result[0].status).toBe('accepted');
    });

    it('should show denied status when any user declines', async () => {
      (prisma.matchUser.findMany as jest.Mock).mockResolvedValue([
        {
          userId: 1,
          match: {
            publicId: 'abc123',
            createdAt: new Date(),
            matchUsers: [
              { userId: 1, accepted: true, user: { firstName: 'Alice', lastName: 'Anderson' } },
              { userId: 2, accepted: false, user: { firstName: 'Bob', lastName: 'Brown' } },
            ],
          },
        },
      ]);

      const result = await service.listForUser(1);

      expect(result[0].status).toBe('denied');
    });

    it('should show expired status when 24h passed with pending responses', async () => {
      const expiredDate = new Date(Date.now() - 25 * 3600000);
      (prisma.matchUser.findMany as jest.Mock).mockResolvedValue([
        {
          userId: 1,
          match: {
            publicId: 'abc123',
            createdAt: expiredDate,
            matchUsers: [
              { userId: 1, accepted: true, user: { firstName: 'Alice', lastName: 'Anderson' } },
              { userId: 2, accepted: null, user: { firstName: 'Bob', lastName: 'Brown' } },
            ],
          },
        },
      ]);

      const result = await service.listForUser(1);

      expect(result[0].status).toBe('expired');
    });

    it('should show Unknown when other user is missing', async () => {
      (prisma.matchUser.findMany as jest.Mock).mockResolvedValue([
        {
          userId: 1,
          match: {
            publicId: 'abc123',
            createdAt: new Date(),
            matchUsers: [
              { userId: 1, accepted: null, user: { firstName: 'Alice', lastName: 'Anderson' } },
            ],
          },
        },
      ]);

      const result = await service.listForUser(1);

      expect(result[0].otherUserName).toBe('Unknown');
    });
  });

  describe('create', () => {
    it('should reject matching a user with themselves', async () => {
      const result = await service.create(
        { userId1: 1, userId2: 1, narrative: 'test', activityIdeaIds: [1, 2, 3] },
        4,
      );

      expect(result.kind).toBe('invalid');
      if (result.kind === 'invalid') {
        expect(result.message).toContain('themselves');
      }
    });

    it('should reject duplicate activity idea IDs', async () => {
      const result = await service.create(
        { userId1: 1, userId2: 2, narrative: 'test', activityIdeaIds: [1, 1, 2] },
        4,
      );

      expect(result.kind).toBe('invalid');
      if (result.kind === 'invalid') {
        expect(result.message).toContain('unique');
      }
    });

    it('should reject when one or both users not found', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.create(
        { userId1: 1, userId2: 2, narrative: 'test', activityIdeaIds: [1, 2, 3] },
        4,
      );

      expect(result.kind).toBe('invalid');
      if (result.kind === 'invalid') {
        expect(result.message).toContain('not found');
      }
    });

    it('should reject when activity ideas are invalid', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: 1, isActive: true });
      (prisma.activityIdea.count as jest.Mock).mockResolvedValue(2);

      const result = await service.create(
        { userId1: 1, userId2: 2, narrative: 'test', activityIdeaIds: [1, 2, 3] },
        4,
      );

      expect(result.kind).toBe('invalid');
      if (result.kind === 'invalid') {
        expect(result.message).toContain('activity ideas');
      }
    });

    it('should create a match successfully', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: 1, isActive: true });
      (prisma.activityIdea.count as jest.Mock).mockResolvedValue(3);
      (prisma.match.create as jest.Mock).mockResolvedValue({ id: 10, publicId: 'xyz123' });
      (prisma.matchUser.createMany as jest.Mock).mockResolvedValue({ count: 2 });
      (prisma.matchActivityIdea.createMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await service.create(
        { userId1: 1, userId2: 2, narrative: 'Great match!', activityIdeaIds: [1, 2, 3] },
        4,
      );

      expect(result.kind).toBe('success');
      if (result.kind === 'success') {
        expect(typeof result.value).toBe('string');
        expect(result.value.length).toBe(10);
      }
      expect(prisma.match.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            narrative: 'Great match!',
            createdByUserId: 4,
          }),
        }),
      );
      expect(prisma.matchUser.createMany).toHaveBeenCalled();
      expect(prisma.matchActivityIdea.createMany).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    const mockMatch = {
      publicId: 'abc123',
      createdAt: new Date(),
      matchUsers: [
        {
          userId: 1,
          accepted: true,
          user: { firstName: 'Alice', lastName: 'Anderson', birthday: new Date('1990-05-15') },
        },
        {
          userId: 2,
          accepted: true,
          user: { firstName: 'Bob', lastName: 'Brown', birthday: new Date('1992-08-20') },
        },
      ],
      matchActivityIdeas: [
        { activityIdea: { id: 1, name: 'Hiking', description: 'Go hiking' } },
        { activityIdea: { id: 2, name: 'Coffee', description: 'Get coffee' } },
      ],
    };

    it('should return not_found for non-existent match', async () => {
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.get('nonexistent', 1, false);

      expect(result.kind).toBe('not_found');
    });

    it('should return not_found when user is not a participant and not admin', async () => {
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch);

      const result = await service.get('abc123', 99, false);

      expect(result.kind).toBe('not_found');
    });

    it('should allow admin to view any match', async () => {
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch);

      const result = await service.get('abc123', 99, true);

      expect(result.kind).toBe('success');
    });

    it('should reveal activity ideas when both accepted', async () => {
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(mockMatch);

      const result = await service.get('abc123', 1, false);

      expect(result.kind).toBe('success');
      if (result.kind === 'success') {
        expect(result.value.bothAccepted).toBe(true);
        expect(result.value.activityIdeas).toHaveLength(2);
      }
    });

    it('should hide activity ideas when not both accepted', async () => {
      const pendingMatch = {
        ...mockMatch,
        matchUsers: [
          { ...mockMatch.matchUsers[0], accepted: true },
          { ...mockMatch.matchUsers[1], accepted: null },
        ],
      };
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(pendingMatch);

      const result = await service.get('abc123', 1, false);

      expect(result.kind).toBe('success');
      if (result.kind === 'success') {
        expect(result.value.bothAccepted).toBe(false);
        expect(result.value.activityIdeas).toHaveLength(0);
      }
    });
  });

  describe('respond', () => {
    const recentMatch = {
      publicId: 'abc123',
      createdAt: new Date(),
      matchUsers: [
        { id: 10, userId: 1, accepted: null },
        { id: 11, userId: 2, accepted: null },
      ],
    };

    it('should return not_found for non-existent match', async () => {
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.respond('nonexistent', 1, true);

      expect(result.kind).toBe('not_found');
    });

    it('should return not_found for non-participant', async () => {
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(recentMatch);

      const result = await service.respond('abc123', 99, true);

      expect(result.kind).toBe('not_found');
    });

    it('should reject response to expired match', async () => {
      const expired = {
        ...recentMatch,
        createdAt: new Date(Date.now() - 25 * 3600000),
      };
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(expired);

      const result = await service.respond('abc123', 1, true);

      expect(result.kind).toBe('invalid');
      if (result.kind === 'invalid') {
        expect(result.message).toContain('expired');
      }
    });

    it('should reject duplicate response', async () => {
      const alreadyResponded = {
        ...recentMatch,
        matchUsers: [
          { id: 10, userId: 1, accepted: true },
          { id: 11, userId: 2, accepted: null },
        ],
      };
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(alreadyResponded);

      const result = await service.respond('abc123', 1, true);

      expect(result.kind).toBe('invalid');
      if (result.kind === 'invalid') {
        expect(result.message).toContain('already responded');
      }
    });

    it('should accept a response successfully', async () => {
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(recentMatch);
      (prisma.matchUser.update as jest.Mock).mockResolvedValue({});

      const result = await service.respond('abc123', 1, true);

      expect(result.kind).toBe('success');
      if (result.kind === 'success') {
        expect(result.value.accepted).toBe(true);
        expect(result.value.bothAccepted).toBe(false);
      }
      expect(prisma.matchUser.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { accepted: true },
      });
    });

    it('should indicate bothAccepted when both users accept', async () => {
      const oneAccepted = {
        ...recentMatch,
        matchUsers: [
          { id: 10, userId: 1, accepted: null },
          { id: 11, userId: 2, accepted: true },
        ],
      };
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(oneAccepted);
      (prisma.matchUser.update as jest.Mock).mockResolvedValue({});

      const result = await service.respond('abc123', 1, true);

      expect(result.kind).toBe('success');
      if (result.kind === 'success') {
        expect(result.value.bothAccepted).toBe(true);
      }
    });
  });
});
