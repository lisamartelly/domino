import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;

  constructor(private readonly config: ConfigService) {
    this.stripe = new Stripe(
      this.config.getOrThrow<string>('STRIPE_SECRET_KEY'),
    );
  }

  async getOrCreateCustomer(
    userId: number,
    email: string,
    existingCustomerId?: string | null,
  ): Promise<string> {
    if (existingCustomerId) {
      return existingCustomerId;
    }

    const customer = await this.stripe.customers.create({
      email,
      metadata: { userId: String(userId) },
    });

    return customer.id;
  }

  async createCheckoutSession(params: {
    customerId: string;
    eventName: string;
    amountCents: number;
    metadata: Record<string, string>;
  }): Promise<string> {
    const session = await this.stripe.checkout.sessions.create({
      customer: params.customerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: params.eventName },
            unit_amount: params.amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: params.metadata,
      allow_promotion_codes: true,
      success_url: `${this.config.getOrThrow<string>('STRIPE_SUCCESS_URL')}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: this.config.getOrThrow<string>('STRIPE_CANCEL_URL'),
    });

    return session.url!;
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    const secret = this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}
