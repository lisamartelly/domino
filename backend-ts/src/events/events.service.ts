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
      startTime: string;
      durationMinutes: number;
      frequencyType: string;
      frequencyCount?: number;
    },
    createdByUserId: number,
  ): Promise<EventDto> {
    const count = data.frequencyCount ?? 1;
    const start = new Date(data.startTime);
    const occurrences = generateOccurrences(
      start,
      data.durationMinutes,
      data.frequencyType,
      count,
    );

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
        _count: { select: { registrations: true } },
      },
    });

    return this.toEventDto(event);
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

    if (needsOccurrenceRegen) {
      const startTime = data.startTime
        ? new Date(data.startTime)
        : existing.startTime;
      const duration = data.durationMinutes ?? existing.durationMinutes;
      const freqType = data.frequencyType ?? existing.frequencyType;
      const freqCount = data.frequencyCount ?? existing.frequencyCount;

      await this.prisma.eventOccurrence.deleteMany({ where: { eventId: id } });

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

    const updated = await this.prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        occurrences: { orderBy: { startTime: 'asc' } },
        _count: { select: { registrations: true } },
      },
    });

    return success(this.toEventDto(updated));
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
        _count: { select: { registrations: true } },
      },
    });

    return success(this.toEventDto(updated));
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
        _count: { select: { registrations: true } },
      },
    });

    return success(this.toEventDto(updated));
  }

  async listAll(): Promise<EventSummaryDto[]> {
    const events = await this.prisma.event.findMany({
      orderBy: { startTime: 'desc' },
      include: { _count: { select: { registrations: true } } },
    });

    return events.map((e) => this.toSummaryDto(e));
  }

  // ── User-facing endpoints ──

  async listPublished(): Promise<EventSummaryDto[]> {
    const events = await this.prisma.event.findMany({
      where: { status: 'published' },
      orderBy: { startTime: 'asc' },
      include: { _count: { select: { registrations: true } } },
    });

    return events.map((e) => this.toSummaryDto(e));
  }

  async getById(id: number): Promise<ServiceResult<EventDto>> {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        occurrences: { orderBy: { startTime: 'asc' } },
        _count: { select: { registrations: true } },
      },
    });

    if (!event) return notFound('Event not found.');
    return success(this.toEventDto(event));
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

  // ── Helpers ──

  private toEventDto(event: {
    id: number;
    name: string;
    description: string;
    location: string;
    costCents: number;
    capacity: number | null;
    startTime: Date;
    durationMinutes: number;
    frequencyType: string;
    frequencyCount: number;
    status: string;
    createdAt: Date;
    occurrences: Array<{
      id: number;
      startTime: Date;
      endTime: Date;
      isCancelled: boolean;
    }>;
    _count: { registrations: number };
  }): EventDto {
    return {
      id: event.id,
      name: event.name,
      description: event.description,
      location: event.location,
      costCents: event.costCents,
      capacity: event.capacity,
      startTime: event.startTime.toISOString(),
      durationMinutes: event.durationMinutes,
      frequencyType: event.frequencyType,
      frequencyCount: event.frequencyCount,
      status: event.status,
      registrationCount: event._count.registrations,
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
    startTime: Date;
    durationMinutes: number;
    frequencyType: string;
    frequencyCount: number;
    status: string;
    _count: { registrations: number };
  }): EventSummaryDto {
    return {
      id: event.id,
      name: event.name,
      description: event.description,
      location: event.location,
      costCents: event.costCents,
      capacity: event.capacity,
      startTime: event.startTime.toISOString(),
      durationMinutes: event.durationMinutes,
      frequencyType: event.frequencyType,
      frequencyCount: event.frequencyCount,
      status: event.status,
      registrationCount: event._count.registrations,
      spotsRemaining:
        event.capacity !== null
          ? Math.max(0, event.capacity - event._count.registrations)
          : null,
    };
  }
}
