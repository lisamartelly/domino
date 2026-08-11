import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import type { ServiceResult } from '../common/service-result';
import { success, notFound, invalid } from '../common/service-result';
import type {
  EventDto,
  EventSummaryDto,
  EventOccurrenceDto,
  EventRegistrationDto,
  EventInterestDto,
  RegisterEventResponseDto,
} from './dto/event.dto';

function generateOccurrences(
  startTime: Date,
  durationMinutes: number,
  frequencyType: string,
  frequencyCount: number,
): Array<{ startTime: Date; endTime: Date }> {
  const occurrences: Array<{ startTime: Date; endTime: Date }> = [];

  for (let i = 0; i < frequencyCount; i++) {
    const occStart = new Date(startTime);

    switch (frequencyType) {
      case 'WEEKLY':
        occStart.setDate(occStart.getDate() + i * 7);
        break;
      case 'BIWEEKLY':
        occStart.setDate(occStart.getDate() + i * 14);
        break;
      case 'MONTHLY':
        occStart.setMonth(occStart.getMonth() + i);
        break;
      case 'ONCE':
      default:
        break;
    }

    const occEnd = new Date(occStart);
    occEnd.setMinutes(occEnd.getMinutes() + durationMinutes);

    occurrences.push({ startTime: occStart, endTime: occEnd });
  }

  return occurrences;
}

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  // ── Admin endpoints ──

  async create(
    data: {
      name: string;
      description: string;
      location: string;
      costCents: number;
      capacity?: number;
      startTime?: string;
      durationMinutes: number;
      frequencyType: string;
      frequencyCount?: number;
      phase?: string;
      anticipatedPriceRange?: string;
    },
    createdByUserId: number,
  ): Promise<EventDto> {
    const count = data.frequencyCount ?? 1;
    const phase = data.phase ?? 'scheduled';
    const start = data.startTime ? new Date(data.startTime) : null;

    const occurrences =
      start
        ? generateOccurrences(start, data.durationMinutes, data.frequencyType, count)
        : [];

    const event = await this.prisma.event.create({
      data: {
        name: data.name,
        description: data.description,
        location: data.location,
        costCents: data.costCents,
        capacity: data.capacity ?? null,
        startTime: start,
        durationMinutes: data.durationMinutes,
        frequencyType: data.frequencyType,
        frequencyCount: count,
        status: 'draft',
        phase,
        anticipatedPriceRange: data.anticipatedPriceRange ?? null,
        createdByUserId,
        occurrences: {
          create: occurrences.map((o) => ({
            startTime: o.startTime,
            endTime: o.endTime,
          })),
        },
      },
      include: {
        occurrences: { orderBy: { startTime: 'asc' } },
        _count: { select: { registrations: true, interests: true } },
        featuredEvent: true,
      },
    });

    return this.toEventDto(event, !!event.featuredEvent);
  }

  async update(
    id: number,
    data: {
      name?: string;
      description?: string;
      location?: string;
      costCents?: number;
      capacity?: number | null;
      startTime?: string;
      durationMinutes?: number;
      frequencyType?: string;
      frequencyCount?: number;
      phase?: string;
      anticipatedPriceRange?: string;
    },
  ): Promise<ServiceResult<EventDto>> {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return notFound('Event not found.');
    }
    if (existing.status === 'cancelled') {
      return invalid('Cannot update a cancelled event.');
    }

    const needsOccurrenceRegen =
      data.startTime !== undefined ||
      data.durationMinutes !== undefined ||
      data.frequencyType !== undefined ||
      data.frequencyCount !== undefined;

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.costCents !== undefined) updateData.costCents = data.costCents;
    if (data.capacity !== undefined) updateData.capacity = data.capacity;
    if (data.startTime !== undefined)
      updateData.startTime = new Date(data.startTime);
    if (data.durationMinutes !== undefined)
      updateData.durationMinutes = data.durationMinutes;
    if (data.frequencyType !== undefined)
      updateData.frequencyType = data.frequencyType;
    if (data.frequencyCount !== undefined)
      updateData.frequencyCount = data.frequencyCount;
    if (data.phase !== undefined) updateData.phase = data.phase;
    if (data.anticipatedPriceRange !== undefined)
      updateData.anticipatedPriceRange = data.anticipatedPriceRange;

    if (needsOccurrenceRegen) {
      const startTime = data.startTime
        ? new Date(data.startTime)
        : existing.startTime;
      const duration = data.durationMinutes ?? existing.durationMinutes;
      const freqType = data.frequencyType ?? existing.frequencyType;
      const freqCount = data.frequencyCount ?? existing.frequencyCount;

      await this.prisma.eventOccurrence.deleteMany({ where: { eventId: id } });

      if (startTime) {
        const occurrences = generateOccurrences(
          startTime,
          duration,
          freqType,
          freqCount,
        );
        await this.prisma.eventOccurrence.createMany({
          data: occurrences.map((o) => ({
            eventId: id,
            startTime: o.startTime,
            endTime: o.endTime,
          })),
        });
      }
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        occurrences: { orderBy: { startTime: 'asc' } },
        _count: { select: { registrations: true, interests: true } },
        featuredEvent: true,
      },
    });

    return success(this.toEventDto(updated, !!updated.featuredEvent));
  }

  async publish(id: number): Promise<ServiceResult<EventDto>> {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) return notFound('Event not found.');
    if (event.status === 'cancelled')
      return invalid('Cannot publish a cancelled event.');
    if (event.status === 'published')
      return invalid('Event is already published.');

    const updated = await this.prisma.event.update({
      where: { id },
      data: { status: 'published' },
      include: {
        occurrences: { orderBy: { startTime: 'asc' } },
        _count: { select: { registrations: true, interests: true } },
        featuredEvent: true,
      },
    });

    return success(this.toEventDto(updated, !!updated.featuredEvent));
  }

  async unpublish(id: number): Promise<ServiceResult<EventDto>> {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) return notFound('Event not found.');
    if (event.status !== 'published')
      return invalid('Only published events can be unpublished.');

    const updated = await this.prisma.event.update({
      where: { id },
      data: { status: 'draft' },
      include: {
        occurrences: { orderBy: { startTime: 'asc' } },
        _count: { select: { registrations: true, interests: true } },
        featuredEvent: true,
      },
    });

    return success(this.toEventDto(updated, !!updated.featuredEvent));
  }

  async cancel(id: number): Promise<ServiceResult<EventDto>> {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) return notFound('Event not found.');
    if (event.status === 'cancelled')
      return invalid('Event is already cancelled.');

    const updated = await this.prisma.event.update({
      where: { id },
      data: { status: 'cancelled' },
      include: {
        occurrences: { orderBy: { startTime: 'asc' } },
        _count: { select: { registrations: true, interests: true } },
        featuredEvent: true,
      },
    });

    return success(this.toEventDto(updated, !!updated.featuredEvent));
  }

  async listAll(): Promise<EventSummaryDto[]> {
    const events = await this.prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { registrations: true, interests: true } },
        featuredEvent: true,
      },
    });

    return events.map((e) => this.toSummaryDto(e, !!e.featuredEvent));
  }

  async setFeatured(
    id: number,
    featured: boolean,
  ): Promise<ServiceResult<{ success: boolean }>> {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) return notFound('Event not found.');

    if (featured) {
      const maxOrder = await this.prisma.featuredEvent.aggregate({
        _max: { sortOrder: true },
      });
      await this.prisma.featuredEvent.upsert({
        where: { eventId: id },
        update: {},
        create: { eventId: id, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
      });
    } else {
      await this.prisma.featuredEvent.deleteMany({ where: { eventId: id } });
    }

    return success({ success: true });
  }

  async reorderFeatured(
    eventIds: number[],
  ): Promise<ServiceResult<{ success: boolean }>> {
    if (eventIds.length === 0) {
      await this.prisma.featuredEvent.deleteMany({});
      return success({ success: true });
    }

    const events = await this.prisma.event.findMany({
      where: { id: { in: eventIds } },
      select: { id: true },
    });
    const validIds = new Set(events.map((e) => e.id));
    const filtered = eventIds.filter((id) => validIds.has(id));

    await this.prisma.$transaction([
      this.prisma.featuredEvent.deleteMany({}),
      ...filtered.map((eventId, i) =>
        this.prisma.featuredEvent.create({
          data: { eventId, sortOrder: i },
        }),
      ),
    ]);

    return success({ success: true });
  }

  async listFeaturedAdmin(): Promise<EventSummaryDto[]> {
    const entries = await this.prisma.featuredEvent.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        event: {
          include: { _count: { select: { registrations: true, interests: true } } },
        },
      },
    });

    return entries.map((fe) => this.toSummaryDto(fe.event, true));
  }

  // ── User-facing endpoints ──

  async listFeatured(): Promise<EventSummaryDto[]> {
    const entries = await this.prisma.featuredEvent.findMany({
      where: { event: { status: 'published' } },
      orderBy: { sortOrder: 'asc' },
      include: {
        event: {
          include: { _count: { select: { registrations: true, interests: true } } },
        },
      },
    });

    if (entries.length > 0) {
      return entries.map((fe) => this.toSummaryDto(fe.event, true));
    }

    return this.listPublished();
  }

  async listPublished(): Promise<EventSummaryDto[]> {
    const now = new Date();
    const events = await this.prisma.event.findMany({
      where: {
        status: 'published',
        OR: [
          // Scheduled events with upcoming occurrences
          {
            phase: 'scheduled',
            occurrences: {
              some: {
                startTime: { gte: now },
                isCancelled: false,
              },
            },
          },
          // Gathering-phase events (no date required)
          { phase: 'gathering' },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { registrations: true, interests: true } },
        featuredEvent: true,
      },
    });

    return events.map((e) => this.toSummaryDto(e, !!e.featuredEvent));
  }

  async getById(id: number): Promise<ServiceResult<EventDto>> {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        occurrences: { orderBy: { startTime: 'asc' } },
        _count: { select: { registrations: true, interests: true } },
        featuredEvent: true,
      },
    });

    if (!event) return notFound('Event not found.');
    return success(this.toEventDto(event, !!event.featuredEvent));
  }

  async register(
    eventId: number,
    userId: number,
    userEmail: string,
  ): Promise<ServiceResult<RegisterEventResponseDto>> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { registrations: true } } },
    });

    if (!event) return notFound('Event not found.');
    if (event.status !== 'published')
      return invalid('Event is not open for registration.');

    if (
      event.capacity !== null &&
      event._count.registrations >= event.capacity
    ) {
      return invalid('Event is full.');
    }

    const existing = await this.prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (existing) {
      return invalid('You are already registered for this event.');
    }

    if (event.costCents === 0) {
      await this.prisma.eventRegistration.create({
        data: {
          eventId,
          userId,
          status: 'confirmed',
          pricePaidCents: 0,
        },
      });
      return success({ registered: true });
    }

    // Paid event: create Stripe checkout
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    const customerId = await this.stripeService.getOrCreateCustomer(
      userId,
      userEmail,
      user?.stripeCustomerId,
    );

    if (!user?.stripeCustomerId) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const registration = await this.prisma.eventRegistration.create({
      data: {
        eventId,
        userId,
        status: 'pending',
        pricePaidCents: event.costCents,
      },
    });

    const checkoutUrl = await this.stripeService.createCheckoutSession({
      customerId,
      eventName: event.name,
      amountCents: event.costCents,
      metadata: {
        registrationId: String(registration.id),
        eventId: String(eventId),
        userId: String(userId),
      },
    });

    await this.prisma.eventRegistration.update({
      where: { id: registration.id },
      data: { stripeSessionId: checkoutUrl },
    });

    return success({ registered: false, checkoutUrl });
  }

  async cancelRegistration(
    eventId: number,
    userId: number,
  ): Promise<ServiceResult<boolean>> {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    if (!registration) return notFound('Registration not found.');
    if (registration.status === 'cancelled')
      return invalid('Registration is already cancelled.');

    await this.prisma.eventRegistration.update({
      where: { id: registration.id },
      data: { status: 'cancelled' },
    });

    return success(true);
  }

  async getMyRegistrations(userId: number): Promise<EventRegistrationDto[]> {
    const registrations = await this.prisma.eventRegistration.findMany({
      where: { userId },
      include: { event: { select: { name: true } } },
      orderBy: { registeredAt: 'desc' },
    });

    return registrations.map((r) => ({
      id: r.id,
      eventId: r.eventId,
      eventName: r.event.name,
      status: r.status,
      pricePaidCents: r.pricePaidCents,
      registeredAt: r.registeredAt.toISOString(),
    }));
  }

  // ── Interest sign-ups ──

  async submitInterest(
    eventId: number,
    data: { name?: string; email: string; openToRomance: boolean; aboutMe: string },
  ): Promise<ServiceResult<{ submitted: boolean }>> {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return notFound('Event not found.');
    if (event.status !== 'published')
      return invalid('Event is not accepting sign-ups.');

    await this.prisma.eventInterest.upsert({
      where: { eventId_email: { eventId, email: data.email } },
      update: {
        name: data.name ?? null,
        openToRomance: data.openToRomance,
        aboutMe: data.aboutMe,
      },
      create: {
        eventId,
        name: data.name ?? null,
        email: data.email,
        openToRomance: data.openToRomance,
        aboutMe: data.aboutMe,
      },
    });

    return success({ submitted: true });
  }

  async getInterests(eventId: number): Promise<ServiceResult<EventInterestDto[]>> {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return notFound('Event not found.');

    const interests = await this.prisma.eventInterest.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });

    return success(
      interests.map((i) => ({
        id: i.id,
        eventId: i.eventId,
        name: i.name,
        email: i.email,
        openToRomance: i.openToRomance,
        aboutMe: i.aboutMe,
        createdAt: i.createdAt.toISOString(),
      })),
    );
  }

  // ── Helpers ──

  private toEventDto(event: {
    id: number;
    name: string;
    description: string;
    location: string;
    costCents: number;
    capacity: number | null;
    startTime: Date | null;
    durationMinutes: number;
    frequencyType: string;
    frequencyCount: number;
    status: string;
    phase: string;
    anticipatedPriceRange: string | null;
    imageUrl: string | null;
    createdAt: Date;
    occurrences: Array<{
      id: number;
      startTime: Date;
      endTime: Date;
      isCancelled: boolean;
    }>;
    _count: { registrations: number; interests: number };
  }, isFeatured: boolean): EventDto {
    return {
      id: event.id,
      name: event.name,
      description: event.description,
      location: event.location,
      costCents: event.costCents,
      capacity: event.capacity,
      startTime: event.startTime?.toISOString() ?? null,
      durationMinutes: event.durationMinutes,
      frequencyType: event.frequencyType,
      frequencyCount: event.frequencyCount,
      status: event.status,
      phase: event.phase,
      anticipatedPriceRange: event.anticipatedPriceRange,
      imageUrl: event.imageUrl,
      isFeatured,
      registrationCount: event._count.registrations,
      interestCount: event._count.interests,
      occurrences: event.occurrences.map((o): EventOccurrenceDto => ({
        id: o.id,
        startTime: o.startTime.toISOString(),
        endTime: o.endTime.toISOString(),
        isCancelled: o.isCancelled,
      })),
      createdAt: event.createdAt.toISOString(),
    };
  }

  private toSummaryDto(event: {
    id: number;
    name: string;
    description: string;
    location: string;
    costCents: number;
    capacity: number | null;
    startTime: Date | null;
    durationMinutes: number;
    frequencyType: string;
    frequencyCount: number;
    status: string;
    phase: string;
    anticipatedPriceRange: string | null;
    imageUrl: string | null;
    _count: { registrations: number; interests: number };
  }, isFeatured: boolean): EventSummaryDto {
    return {
      id: event.id,
      name: event.name,
      description: event.description,
      location: event.location,
      costCents: event.costCents,
      capacity: event.capacity,
      startTime: event.startTime?.toISOString() ?? null,
      durationMinutes: event.durationMinutes,
      frequencyType: event.frequencyType,
      frequencyCount: event.frequencyCount,
      status: event.status,
      phase: event.phase,
      anticipatedPriceRange: event.anticipatedPriceRange,
      imageUrl: event.imageUrl,
      isFeatured,
      registrationCount: event._count.registrations,
      interestCount: event._count.interests,
      spotsRemaining:
        event.capacity !== null
          ? Math.max(0, event.capacity - event._count.registrations)
          : null,
    };
  }
}
