import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';

describe('EventsService', () => {
  let service: EventsService;
  let prisma: jest.Mocked<PrismaService>;
  let stripe: jest.Mocked<StripeService>;

  beforeEach(() => {
    prisma = {
      event: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      eventOccurrence: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      eventRegistration: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    stripe = {
      getOrCreateCustomer: jest.fn(),
      createCheckoutSession: jest.fn(),
    } as unknown as jest.Mocked<StripeService>;

    service = new EventsService(prisma, stripe);
  });

  describe('create', () => {
    const createData = {
      name: 'Test Event',
      description: 'A test event',
      location: 'Test Location',
      costCents: 1500,
      startTime: '2026-08-01T18:00:00.000Z',
      durationMinutes: 60,
      frequencyType: 'ONCE',
    };

    it('should create event with a single occurrence for ONCE frequency', async () => {
      const mockEvent = {
        id: 1,
        ...createData,
        capacity: null,
        frequencyCount: 1,
        status: 'draft',
        createdByUserId: 4,
        startTime: new Date(createData.startTime),
        createdAt: new Date(),
        updatedAt: new Date(),
        occurrences: [
          {
            id: 1,
            startTime: new Date('2026-08-01T18:00:00Z'),
            endTime: new Date('2026-08-01T19:00:00Z'),
            isCancelled: false,
          },
        ],
        _count: { registrations: 0 },
      };

      (prisma.event.create as jest.Mock).mockResolvedValue(mockEvent);

      const result = await service.create(createData, 4);

      expect(prisma.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Test Event',
            status: 'draft',
            createdByUserId: 4,
            occurrences: {
              create: expect.arrayContaining([
                expect.objectContaining({ startTime: expect.any(Date) }),
              ]),
            },
          }),
        }),
      );
      expect(result.id).toBe(1);
      expect(result.status).toBe('draft');
      expect(result.occurrences).toHaveLength(1);
    });

    it('should generate multiple occurrences for WEEKLY frequency', async () => {
      const weeklyData = {
        ...createData,
        frequencyType: 'WEEKLY',
        frequencyCount: 4,
      };

      const mockEvent = {
        id: 2,
        ...weeklyData,
        capacity: null,
        status: 'draft',
        createdByUserId: 4,
        startTime: new Date(weeklyData.startTime),
        createdAt: new Date(),
        updatedAt: new Date(),
        occurrences: [
          {
            id: 1,
            startTime: new Date('2026-08-01T18:00:00Z'),
            endTime: new Date('2026-08-01T19:00:00Z'),
            isCancelled: false,
          },
          {
            id: 2,
            startTime: new Date('2026-08-08T18:00:00Z'),
            endTime: new Date('2026-08-08T19:00:00Z'),
            isCancelled: false,
          },
          {
            id: 3,
            startTime: new Date('2026-08-15T18:00:00Z'),
            endTime: new Date('2026-08-15T19:00:00Z'),
            isCancelled: false,
          },
          {
            id: 4,
            startTime: new Date('2026-08-22T18:00:00Z'),
            endTime: new Date('2026-08-22T19:00:00Z'),
            isCancelled: false,
          },
        ],
        _count: { registrations: 0 },
      };

      (prisma.event.create as jest.Mock).mockResolvedValue(mockEvent);

      const result = await service.create(weeklyData, 4);

      const createCall = (prisma.event.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.occurrences.create).toHaveLength(4);
      expect(result.occurrences).toHaveLength(4);
    });
  });

  describe('publish', () => {
    it('should publish a draft event', async () => {
      (prisma.event.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        status: 'draft',
      });
      (prisma.event.update as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Test',
        description: '',
        location: '',
        costCents: 0,
        capacity: null,
        startTime: new Date(),
        durationMinutes: 60,
        frequencyType: 'ONCE',
        frequencyCount: 1,
        status: 'published',
        createdAt: new Date(),
        occurrences: [],
        _count: { registrations: 0 },
      });

      const result = await service.publish(1);

      expect(result.kind).toBe('success');
      if (result.kind === 'success') {
        expect(result.value.status).toBe('published');
      }
    });

    it('should reject publishing a cancelled event', async () => {
      (prisma.event.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        status: 'cancelled',
      });

      const result = await service.publish(1);

      expect(result.kind).toBe('invalid');
    });

    it('should reject publishing an already published event', async () => {
      (prisma.event.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        status: 'published',
      });

      const result = await service.publish(1);

      expect(result.kind).toBe('invalid');
    });

    it('should return not_found for non-existent event', async () => {
      (prisma.event.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.publish(999);

      expect(result.kind).toBe('not_found');
    });
  });

  describe('cancel', () => {
    it('should cancel a published event', async () => {
      (prisma.event.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        status: 'published',
      });
      (prisma.event.update as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Test',
        description: '',
        location: '',
        costCents: 0,
        capacity: null,
        startTime: new Date(),
        durationMinutes: 60,
        frequencyType: 'ONCE',
        frequencyCount: 1,
        status: 'cancelled',
        createdAt: new Date(),
        occurrences: [],
        _count: { registrations: 0 },
      });

      const result = await service.cancel(1);

      expect(result.kind).toBe('success');
      if (result.kind === 'success') {
        expect(result.value.status).toBe('cancelled');
      }
    });

    it('should reject cancelling an already cancelled event', async () => {
      (prisma.event.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        status: 'cancelled',
      });

      const result = await service.cancel(1);

      expect(result.kind).toBe('invalid');
    });
  });

  describe('register', () => {
    const publishedEvent = {
      id: 1,
      name: 'Test Event',
      status: 'published',
      costCents: 0,
      capacity: 10,
      _count: { registrations: 5 },
    };

    it('should register for a free event immediately', async () => {
      (prisma.event.findUnique as jest.Mock).mockResolvedValue(publishedEvent);
      (prisma.eventRegistration.findUnique as jest.Mock).mockResolvedValue(
        null,
      );
      (prisma.eventRegistration.create as jest.Mock).mockResolvedValue({
        id: 1,
      });

      const result = await service.register(1, 4, 'admin@test.com');

      expect(result.kind).toBe('success');
      if (result.kind === 'success') {
        expect(result.value.registered).toBe(true);
        expect(result.value.checkoutUrl).toBeUndefined();
      }
      expect(prisma.eventRegistration.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'confirmed',
            pricePaidCents: 0,
          }),
        }),
      );
    });

    it('should create Stripe checkout for a paid event', async () => {
      const paidEvent = { ...publishedEvent, costCents: 2000 };
      (prisma.event.findUnique as jest.Mock).mockResolvedValue(paidEvent);
      (prisma.eventRegistration.findUnique as jest.Mock).mockResolvedValue(
        null,
      );
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        stripeCustomerId: null,
      });
      (stripe.getOrCreateCustomer as jest.Mock).mockResolvedValue('cus_123');
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      (prisma.eventRegistration.create as jest.Mock).mockResolvedValue({
        id: 1,
      });
      (stripe.createCheckoutSession as jest.Mock).mockResolvedValue(
        'https://checkout.stripe.com/session',
      );
      (prisma.eventRegistration.update as jest.Mock).mockResolvedValue({});

      const result = await service.register(1, 4, 'admin@test.com');

      expect(result.kind).toBe('success');
      if (result.kind === 'success') {
        expect(result.value.registered).toBe(false);
        expect(result.value.checkoutUrl).toBe(
          'https://checkout.stripe.com/session',
        );
      }
      expect(prisma.eventRegistration.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'pending',
            pricePaidCents: 2000,
          }),
        }),
      );
    });

    it('should reject registration for unpublished event', async () => {
      (prisma.event.findUnique as jest.Mock).mockResolvedValue({
        ...publishedEvent,
        status: 'draft',
      });

      const result = await service.register(1, 4, 'admin@test.com');

      expect(result.kind).toBe('invalid');
    });

    it('should reject registration when event is full', async () => {
      const fullEvent = {
        ...publishedEvent,
        capacity: 5,
        _count: { registrations: 5 },
      };
      (prisma.event.findUnique as jest.Mock).mockResolvedValue(fullEvent);

      const result = await service.register(1, 4, 'admin@test.com');

      expect(result.kind).toBe('invalid');
    });

    it('should reject duplicate registration', async () => {
      (prisma.event.findUnique as jest.Mock).mockResolvedValue(publishedEvent);
      (prisma.eventRegistration.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
      });

      const result = await service.register(1, 4, 'admin@test.com');

      expect(result.kind).toBe('invalid');
    });

    it('should return not_found for non-existent event', async () => {
      (prisma.event.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.register(999, 4, 'admin@test.com');

      expect(result.kind).toBe('not_found');
    });
  });

  describe('cancelRegistration', () => {
    it('should cancel an existing registration', async () => {
      (prisma.eventRegistration.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        status: 'confirmed',
      });
      (prisma.eventRegistration.update as jest.Mock).mockResolvedValue({});

      const result = await service.cancelRegistration(1, 4);

      expect(result.kind).toBe('success');
      expect(prisma.eventRegistration.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'cancelled' } }),
      );
    });

    it('should reject cancelling an already cancelled registration', async () => {
      (prisma.eventRegistration.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        status: 'cancelled',
      });

      const result = await service.cancelRegistration(1, 4);

      expect(result.kind).toBe('invalid');
    });

    it('should return not_found for non-existent registration', async () => {
      (prisma.eventRegistration.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      const result = await service.cancelRegistration(1, 4);

      expect(result.kind).toBe('not_found');
    });
  });

  describe('listPublished', () => {
    it('should return only published events', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          name: 'Published Event',
          description: '',
          location: '',
          costCents: 0,
          capacity: 20,
          startTime: new Date(),
          durationMinutes: 60,
          frequencyType: 'ONCE',
          frequencyCount: 1,
          status: 'published',
          _count: { registrations: 3 },
        },
      ]);

      const result = await service.listPublished();

      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'published' } }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].spotsRemaining).toBe(17);
    });

    it('should return null spotsRemaining for unlimited capacity', async () => {
      (prisma.event.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          name: 'Open Event',
          description: '',
          location: '',
          costCents: 0,
          capacity: null,
          startTime: new Date(),
          durationMinutes: 60,
          frequencyType: 'ONCE',
          frequencyCount: 1,
          status: 'published',
          _count: { registrations: 10 },
        },
      ]);

      const result = await service.listPublished();

      expect(result[0].spotsRemaining).toBeNull();
    });
  });

  describe('getMyRegistrations', () => {
    it('should return user registrations with event names', async () => {
      (prisma.eventRegistration.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          eventId: 1,
          status: 'confirmed',
          pricePaidCents: 0,
          registeredAt: new Date('2026-08-01T18:00:00Z'),
          event: { name: 'Test Event' },
        },
      ]);

      const result = await service.getMyRegistrations(4);

      expect(result).toHaveLength(1);
      expect(result[0].eventName).toBe('Test Event');
      expect(result[0].status).toBe('confirmed');
    });
  });
});
