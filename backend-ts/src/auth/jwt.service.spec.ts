import { ConfigService } from '@nestjs/config';
import { JwtService } from './jwt.service';

describe('JwtService', () => {
  let jwtService: JwtService;

  const mockConfig = {
    JWT_SECRET_KEY: 'test-secret-key-that-is-at-least-32-bytes-long!!',
    JWT_ISSUER: 'Domino.Backend',
    JWT_AUDIENCE: 'Domino.Frontend',
    JWT_ACCESS_TOKEN_EXPIRATION_MINUTES: 15,
  };

  beforeEach(() => {
    const configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        return mockConfig[key as keyof typeof mockConfig] ?? defaultValue;
      }),
    } as unknown as ConfigService;

    jwtService = new JwtService(configService);
  });

  const testUser = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    roles: ['User'],
  };

  describe('generateAccessToken', () => {
    it('should generate a valid JWT string', () => {
      const token = jwtService.generateAccessToken(testUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should embed correct claims in the token', () => {
      const token = jwtService.generateAccessToken(testUser);
      const payload = jwtService.verifyToken(token);

      expect(payload.sub).toBe('1');
      expect(payload.email).toBe('test@example.com');
      expect(payload.roles).toEqual(['User']);
      expect(payload.jti).toBeDefined();
    });

    it('should include multiple roles', () => {
      const adminUser = { ...testUser, roles: ['Admin', 'SuperDuperAdmin'] };
      const token = jwtService.generateAccessToken(adminUser);
      const payload = jwtService.verifyToken(token);

      expect(payload.roles).toEqual(['Admin', 'SuperDuperAdmin']);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = jwtService.generateAccessToken(testUser);
      const payload = jwtService.verifyToken(token);

      expect(payload.sub).toBe('1');
      expect(payload.email).toBe('test@example.com');
    });

    it('should throw on an invalid token', () => {
      expect(() => jwtService.verifyToken('invalid.token.here')).toThrow();
    });

    it('should throw on a token signed with a different secret', () => {
      const otherConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'JWT_SECRET_KEY')
            return 'a-completely-different-secret-key-32-bytes!!';
          return mockConfig[key as keyof typeof mockConfig];
        }),
      } as unknown as ConfigService;

      const otherJwtService = new JwtService(otherConfigService);
      const token = otherJwtService.generateAccessToken(testUser);

      expect(() => jwtService.verifyToken(token)).toThrow();
    });
  });
});
