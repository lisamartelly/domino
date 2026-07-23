import { BadRequestException } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { PrismaService } from '../prisma/prisma.service';

describe('StripeController', () => {
  let controller: StripeController;
  let stripeService: jest.Mocked<StripeService>;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    stripeService = {
      constructWebhookEvent: jest.fn(),
    } as unknown as jest.Mocked<StripeService>;

    prisma = {
      eventRegistration: {
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    controller = new StripeController(stripeService, prisma);
  });

  const mockReq = (rawBody?: Buffer) => ({ rawBody }) as any;

  describe('handleWebhook', () => {
    it('should throw if raw body is missing', async () => {
      await expect(
        controller.handleWebhook(mockReq(), 'sig_123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if signature verification fails', async () => {
      (stripeService.constructWebhookEvent as jest.Mock).mockImplementation(
        () => {
          throw new Error('Invalid signature');
        },
      );

      await expect(
        controller.handleWebhook(mockReq(Buffer.from('body')), 'bad_sig'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should confirm registration on checkout.session.completed', async () => {
      (stripeService.constructWebhookEvent as jest.Mock).mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { registrationId: '42' },
            payment_intent: 'pi_abc123',
          },
        },
      });
      (prisma.eventRegistration.update as jest.Mock).mockResolvedValue({});

      const result = await controller.handleWebhook(
        mockReq(Buffer.from('body')),
        'sig_valid',
      );

      expect(result).toEqual({ received: true });
      expect(prisma.eventRegistration.update).toHaveBeenCalledWith({
        where: { id: 42 },
        data: {
          status: 'confirmed',
          stripePaymentIntentId: 'pi_abc123',
        },
      });
    });

    it('should delete pending registration on checkout.session.expired', async () => {
      (stripeService.constructWebhookEvent as jest.Mock).mockReturnValue({
        type: 'checkout.session.expired',
        data: {
          object: {
            metadata: { registrationId: '42' },
          },
        },
      });
      (prisma.eventRegistration.deleteMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      const result = await controller.handleWebhook(
        mockReq(Buffer.from('body')),
        'sig_valid',
      );

      expect(result).toEqual({ received: true });
      expect(prisma.eventRegistration.deleteMany).toHaveBeenCalledWith({
        where: { id: 42, status: 'pending' },
      });
    });

    it('should ignore unhandled event types', async () => {
      (stripeService.constructWebhookEvent as jest.Mock).mockReturnValue({
        type: 'payment_intent.succeeded',
        data: { object: {} },
      });

      const result = await controller.handleWebhook(
        mockReq(Buffer.from('body')),
        'sig_valid',
      );

      expect(result).toEqual({ received: true });
      expect(prisma.eventRegistration.update).not.toHaveBeenCalled();
      expect(prisma.eventRegistration.deleteMany).not.toHaveBeenCalled();
    });
  });
});
