import { NewsletterService } from './newsletter.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NewsletterService', () => {
  let service: NewsletterService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      newsletterSubscriber: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    service = new NewsletterService(prisma);
  });

  describe('subscribe', () => {
    it('should create a new subscription and return true', async () => {
      (prisma.newsletterSubscriber.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.newsletterSubscriber.create as jest.Mock).mockResolvedValue({});

      const result = await service.subscribe('Test@Example.COM');

      expect(result).toBe(true);
      expect(prisma.newsletterSubscriber.create).toHaveBeenCalledWith({
        data: { email: 'test@example.com', source: 'newsletter' },
      });
    });

    it('should return false for duplicate email', async () => {
      (prisma.newsletterSubscriber.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
      });

      const result = await service.subscribe('test@example.com');

      expect(result).toBe(false);
      expect(prisma.newsletterSubscriber.create).not.toHaveBeenCalled();
    });

    it('should normalise email (trim and lowercase)', async () => {
      (prisma.newsletterSubscriber.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.newsletterSubscriber.create as jest.Mock).mockResolvedValue({});

      await service.subscribe('  User@Example.COM  ');

      expect(prisma.newsletterSubscriber.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      });
    });

    it('should use custom source when provided', async () => {
      (prisma.newsletterSubscriber.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.newsletterSubscriber.create as jest.Mock).mockResolvedValue({});

      await service.subscribe('test@example.com', 'landing_page');

      expect(prisma.newsletterSubscriber.create).toHaveBeenCalledWith({
        data: { email: 'test@example.com', source: 'landing_page' },
      });
    });
  });

  describe('list', () => {
    it('should return all subscribers sorted by most recent', async () => {
      const now = new Date();
      (prisma.newsletterSubscriber.findMany as jest.Mock).mockResolvedValue([
        { id: 2, email: 'b@test.com', source: 'newsletter', subscribedAt: now },
        { id: 1, email: 'a@test.com', source: 'landing', subscribedAt: now },
      ]);

      const result = await service.list();

      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('b@test.com');
      expect(result[0].subscribedAt).toBe(now.toISOString());
      expect(prisma.newsletterSubscriber.findMany).toHaveBeenCalledWith({
        orderBy: { subscribedAt: 'desc' },
      });
    });
  });
});
