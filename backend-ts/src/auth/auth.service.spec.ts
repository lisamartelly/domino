import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';
import { RefreshTokenService } from './refresh-token.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let refreshTokenService: jest.Mocked<RefreshTokenService>;

  beforeEach(() => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      role: {
        findFirst: jest.fn(),
      },
      userRole: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      surveyResponse: {
        findFirst: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    jwtService = {
      generateAccessToken: jest.fn().mockReturnValue('mock-access-token'),
    } as unknown as jest.Mocked<JwtService>;

    refreshTokenService = {
      generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
      storeRefreshToken: jest.fn().mockResolvedValue(undefined),
      validateRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<RefreshTokenService>;

    authService = new AuthService(prisma, jwtService, refreshTokenService);
  });

  describe('register', () => {
    const registerRequest = {
      email: 'new@example.com',
      password: 'Password123!',
      firstName: 'New',
      lastName: 'User',
      birthday: '1990-01-15',
    };

    it('should register a new user successfully', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
      });
      (prisma.role.findFirst as jest.Mock).mockResolvedValue({
        id: 3,
        name: 'User',
      });
      (prisma.userRole.create as jest.Mock).mockResolvedValue({});

      const result = await authService.register(registerRequest);

      expect(result.response.success).toBe(true);
      expect(result.response.message).toBe('Registration successful');
      expect(result.response.accessToken).toBe('mock-access-token');
      expect(result.response.user?.email).toBe('new@example.com');
      expect(result.response.user?.roles).toEqual(['User']);
      expect(result.response.user?.hasCompletedIntake).toBe(false);
      expect(result.refreshCookieValue).toContain('mock-refresh-token');
    });

    it('should reject duplicate email', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'new@example.com',
      });

      const result = await authService.register(registerRequest);

      expect(result.response.success).toBe(false);
      expect(result.response.message).toBe('Registration failed');
      expect(result.refreshCookieValue).toBe('');
    });

    it('should hash the password before storing', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockImplementation(({ data }) => {
        expect(data.passwordHash).not.toBe('Password123!');
        expect(data.passwordHash).toBeDefined();
        return Promise.resolve({
          id: 1,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
        });
      });
      (prisma.role.findFirst as jest.Mock).mockResolvedValue({
        id: 3,
        name: 'User',
      });
      (prisma.userRole.create as jest.Mock).mockResolvedValue({});

      await authService.register(registerRequest);

      expect(prisma.user.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const hashedPassword = bcrypt.hashSync('Password123!', 10);

    const activeUser = {
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      passwordHash: hashedPassword,
      lockoutEnabled: true,
      lockoutEnd: null,
      accessFailedCount: 0,
    };

    it('should login successfully with correct credentials', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(activeUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(activeUser);
      (prisma.userRole.findMany as jest.Mock).mockResolvedValue([
        { role: { name: 'User' } },
      ]);
      (prisma.surveyResponse.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await authService.login(
        'test@example.com',
        'Password123!',
      );

      expect(result.response.success).toBe(true);
      expect(result.response.message).toBe('Login successful');
      expect(result.response.accessToken).toBe('mock-access-token');
      expect(result.response.user?.hasCompletedIntake).toBe(false);
    });

    it('should reject non-existent user', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await authService.login(
        'nobody@example.com',
        'Password123!',
      );

      expect(result.response.success).toBe(false);
      expect(result.response.message).toBe('Invalid email or password');
    });

    it('should reject inactive user', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        ...activeUser,
        isActive: false,
      });

      const result = await authService.login(
        'test@example.com',
        'Password123!',
      );

      expect(result.response.success).toBe(false);
      expect(result.response.message).toBe('Invalid email or password');
    });

    it('should reject wrong password and increment failed count', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(activeUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(activeUser);

      const result = await authService.login(
        'test@example.com',
        'WrongPassword!',
      );

      expect(result.response.success).toBe(false);
      expect(result.response.message).toBe('Invalid email or password');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { accessFailedCount: { increment: 1 } },
      });
    });

    it('should reject locked out user', async () => {
      const lockedUser = {
        ...activeUser,
        lockoutEnd: new Date(Date.now() + 60000),
      };
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(lockedUser);

      const result = await authService.login(
        'test@example.com',
        'Password123!',
      );

      expect(result.response.success).toBe(false);
      expect(result.response.message).toBe(
        'Account is locked. Please try again later.',
      );
    });

    it('should set hasCompletedIntake true for admins', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(activeUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(activeUser);
      (prisma.userRole.findMany as jest.Mock).mockResolvedValue([
        { role: { name: 'Admin' } },
      ]);

      const result = await authService.login(
        'test@example.com',
        'Password123!',
      );

      expect(result.response.success).toBe(true);
      expect(result.response.user?.hasCompletedIntake).toBe(true);
      // Should NOT query surveyResponse for admins
      expect(prisma.surveyResponse.findFirst).not.toHaveBeenCalled();
    });

    it('should reset access failed count on successful login', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(activeUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(activeUser);
      (prisma.userRole.findMany as jest.Mock).mockResolvedValue([
        { role: { name: 'User' } },
      ]);
      (prisma.surveyResponse.findFirst as jest.Mock).mockResolvedValue(null);

      await authService.login('test@example.com', 'Password123!');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { accessFailedCount: 0, lockoutEnd: null },
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should return null for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await authService.getCurrentUser(999);

      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        isActive: false,
      });

      const result = await authService.getCurrentUser(1);

      expect(result).toBeNull();
    });

    it('should return UserDto for active user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
      });
      (prisma.userRole.findMany as jest.Mock).mockResolvedValue([
        { role: { name: 'User' } },
      ]);
      (prisma.surveyResponse.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await authService.getCurrentUser(1);

      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['User'],
        hasCompletedIntake: false,
      });
    });
  });
});
