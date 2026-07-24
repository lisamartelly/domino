import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { NewsletterSubscriberDto } from './dto/newsletter.dto';

@Injectable()
export class NewsletterService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(email: string): Promise<boolean> {
    const normalised = email.trim().toLowerCase();

    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email: normalised },
    });

    if (existing) {
      return false;
    }

    await this.prisma.newsletterSubscriber.create({
      data: { email: normalised },
    });

    return true;
  }

  async list(): Promise<NewsletterSubscriberDto[]> {
    const subscribers = await this.prisma.newsletterSubscriber.findMany({
      orderBy: { subscribedAt: 'desc' },
    });

    return subscribers.map((s) => ({
      id: s.id,
      email: s.email,
      subscribedAt: s.subscribedAt.toISOString(),
    }));
  }
}
