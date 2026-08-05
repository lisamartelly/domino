import { ActivityIdeasService } from './activity-ideas.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ActivityIdeasService', () => {
  let service: ActivityIdeasService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      activityIdea: {
        findMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    service = new ActivityIdeasService(prisma);
  });

  describe('list', () => {
    it('should return all activity ideas sorted by name', async () => {
      (prisma.activityIdea.findMany as jest.Mock).mockResolvedValue([
        { id: 1, name: 'Coffee', description: 'Get coffee together' },
        { id: 2, name: 'Hiking', description: 'Go for a hike' },
      ]);

      const result = await service.list();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Coffee');
      expect(prisma.activityIdea.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('create', () => {
    it('should create and return a new activity idea', async () => {
      (prisma.activityIdea.create as jest.Mock).mockResolvedValue({
        id: 3,
        name: 'Bowling',
        description: 'Go bowling',
      });

      const result = await service.create('Bowling', 'Go bowling');

      expect(result).toEqual({ id: 3, name: 'Bowling', description: 'Go bowling' });
      expect(prisma.activityIdea.create).toHaveBeenCalledWith({
        data: { name: 'Bowling', description: 'Go bowling' },
      });
    });
  });

  describe('update', () => {
    it('should return not_found for non-existent idea', async () => {
      (prisma.activityIdea.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.update(999, 'New Name', 'New Desc');

      expect(result.kind).toBe('not_found');
    });

    it('should update an existing activity idea', async () => {
      (prisma.activityIdea.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Old',
        description: 'Old desc',
      });
      (prisma.activityIdea.update as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Updated',
        description: 'Updated desc',
      });

      const result = await service.update(1, 'Updated', 'Updated desc');

      expect(result.kind).toBe('success');
      if (result.kind === 'success') {
        expect(result.value.name).toBe('Updated');
      }
    });
  });

  describe('delete', () => {
    it('should return not_found for non-existent idea', async () => {
      (prisma.activityIdea.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.delete(999);

      expect(result.kind).toBe('not_found');
    });

    it('should delete an existing activity idea', async () => {
      (prisma.activityIdea.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Test',
        description: 'Test desc',
      });
      (prisma.activityIdea.delete as jest.Mock).mockResolvedValue({});

      const result = await service.delete(1);

      expect(result.kind).toBe('success');
      if (result.kind === 'success') {
        expect(result.value).toBe(true);
      }
    });
  });
});
