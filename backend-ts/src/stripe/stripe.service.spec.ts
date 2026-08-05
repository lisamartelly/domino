import { ConfigService } from '@nestjs/config';
import { StripeService } from './stripe.service';

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'cus_new123' }),
    },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/session123' }),
      },
    },
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({ type: 'checkout.session.completed' }),
    },
  }));
});

describe('StripeService', () => {
  let service: StripeService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    configService = {
      getOrThrow: jest.fn().mockImplementation((key: string) => {
        const values: Record<string, string> = {
          STRIPE_SECRET_KEY: 'sk_test_fake',
          STRIPE_SUCCESS_URL: 'https://example.com/success',
          STRIPE_CANCEL_URL: 'https://example.com/cancel',
          STRIPE_WEBHOOK_SECRET: 'whsec_test',
        };
        return values[key];
      }),
    } as unknown as jest.Mocked<ConfigService>;

    service = new StripeService(configService);
  });

  describe('getOrCreateCustomer', () => {
    it('should return existing customer ID when provided', async () => {
      const result = await service.getOrCreateCustomer(1, 'test@example.com', 'cus_existing');

      expect(result).toBe('cus_existing');
    });

    it('should create a new customer when no existing ID', async () => {
      const result = await service.getOrCreateCustomer(1, 'test@example.com');

      expect(result).toBe('cus_new123');
    });

    it('should create a new customer when existing ID is null', async () => {
      const result = await service.getOrCreateCustomer(1, 'test@example.com', null);

      expect(result).toBe('cus_new123');
    });
  });

  describe('createCheckoutSession', () => {
    it('should create a checkout session and return URL', async () => {
      const result = await service.createCheckoutSession({
        customerId: 'cus_123',
        eventName: 'Wine Tasting',
        amountCents: 2500,
        metadata: { eventId: '1', userId: '4' },
      });

      expect(result).toBe('https://checkout.stripe.com/session123');
    });
  });

  describe('constructWebhookEvent', () => {
    it('should construct and return a Stripe event', () => {
      const payload = Buffer.from('{}');
      const result = service.constructWebhookEvent(payload, 'sig_test');

      expect(result.type).toBe('checkout.session.completed');
    });
  });
});
