import { createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenService } from './refresh-token.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let prisma: jest.Mocked<PrismaService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    prisma = {
      userToken: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        deleteMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    configService = {
      get: jest.fn().mockReturnValue(7),
    } as unknown as jest.Mocked<ConfigService>;

    service = new RefreshTokenService(prisma, configService);
  });

  describe('generateRefreshToken', () => {
    it('should generate a base64 string', () => {
      const token = service.generateRefreshToken();

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate unique tokens', () => {
      const t1 = service.generateRefreshToken();
      const t2 = service.generateRefreshToken();

      expect(t1).not.toBe(t2);
    });
  });

  describe('hashToken', () => {
    it('should return a consistent SHA-256 hash', () => {
      const hash = service.hashToken('test-token');
      const expected = createHash('sha256').update('test-token', 'utf8').digest('base64');

      expect(hash).toBe(expected);
    });
  });

  describe('storeRefreshToken', () => {
    it('should upsert a token into user_tokens', async () => {
      const user = { id: 1 } as any;
      (prisma.userToken.upsert as jest.Mock).mockResolvedValue({});

      await service.storeRefreshToken(user, 'my-token', 'family-1');

      expect(prisma.userToken.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_loginProvider_name: {
              userId: 1,
              loginProvider: 'RefreshToken',
              name: 'RefreshToken',
            },
          },
        }),
      );

      const call = (prisma.userToken.upsert as jest.Mock).mock.calls[0][0];
      const stored = JSON.parse(call.create.value);
      expect(stored.TokenFamilyId).toBe('family-1');
      expect(stored.TokenHash).toBe(service.hashToken('my-token'));
    });
  });

  describe('validateRefreshToken', () => {
    it('should return invalid for NaN userId', async () => {
      const result = await service.validateRefreshToken('token', 'not-a-number');

      expect(result.isValid).toBe(false);
      expect(result.user).toBeNull();
    });

    it('should return invalid for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.validateRefreshToken('token', '999');

      expect(result.isValid).toBe(false);
    });

    it('should return invalid when no stored token exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.userToken.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.validateRefreshToken('token', '1');

      expect(result.isValid).toBe(false);
    });

    it('should return invalid for malformed stored token JSON', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.userToken.findUnique as jest.Mock).mockResolvedValue({
        value: 'not-valid-json',
      });

      const result = await service.validateRefreshToken('token', '1');

      expect(result.isValid).toBe(false);
    });

    it('should return invalid when token hash does not match', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.userToken.findUnique as jest.Mock).mockResolvedValue({
        value: JSON.stringify({
          TokenHash: 'wrong-hash',
          ExpiresAt: new Date(Date.now() + 86400000).toISOString(),
          TokenFamilyId: 'family-1',
        }),
      });

      const result = await service.validateRefreshToken('token', '1');

      expect(result.isValid).toBe(false);
    });

    it('should return invalid and revoke when token is expired', async () => {
      const user = { id: 1 };
      const tokenHash = service.hashToken('my-token');
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (prisma.userToken.findUnique as jest.Mock).mockResolvedValue({
        value: JSON.stringify({
          TokenHash: tokenHash,
          ExpiresAt: new Date(Date.now() - 86400000).toISOString(),
          TokenFamilyId: 'family-1',
        }),
      });
      (prisma.userToken.deleteMany as jest.Mock).mockResolvedValue({});

      const result = await service.validateRefreshToken('my-token', '1');

      expect(result.isValid).toBe(false);
      expect(prisma.userToken.deleteMany).toHaveBeenCalled();
    });

    it('should return valid for correct, non-expired token', async () => {
      const user = { id: 1, email: 'test@example.com' };
      const tokenHash = service.hashToken('my-token');
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (prisma.userToken.findUnique as jest.Mock).mockResolvedValue({
        value: JSON.stringify({
          TokenHash: tokenHash,
          ExpiresAt: new Date(Date.now() + 86400000).toISOString(),
          TokenFamilyId: 'family-1',
        }),
      });

      const result = await service.validateRefreshToken('my-token', '1');

      expect(result.isValid).toBe(true);
      expect(result.user).toBe(user);
      expect(result.tokenFamilyId).toBe('family-1');
    });
  });

  describe('revokeRefreshToken', () => {
    it('should delete user tokens', async () => {
      const user = { id: 1 } as any;
      (prisma.userToken.deleteMany as jest.Mock).mockResolvedValue({});

      await service.revokeRefreshToken(user);

      expect(prisma.userToken.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          loginProvider: 'RefreshToken',
          name: 'RefreshToken',
        },
      });
    });
  });
});
