import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { StripeService } from './stripe.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody;
    if (!rawBody) {
      throw new BadRequestException(
        'Missing raw body for webhook verification',
      );
    }

    let event;
    try {
      event = this.stripeService.constructWebhookEvent(rawBody, signature);
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const registrationId = session.metadata?.registrationId;
        if (registrationId) {
          await this.prisma.eventRegistration.update({
            where: { id: parseInt(registrationId, 10) },
            data: {
              status: 'confirmed',
              stripePaymentIntentId:
                typeof session.payment_intent === 'string'
                  ? session.payment_intent
                  : null,
            },
          });
        }
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object;
        const registrationId = session.metadata?.registrationId;
        if (registrationId) {
          await this.prisma.eventRegistration.deleteMany({
            where: {
              id: parseInt(registrationId, 10),
              status: 'pending',
            },
          });
        }
        break;
      }
    }

    return { received: true };
  }
}
