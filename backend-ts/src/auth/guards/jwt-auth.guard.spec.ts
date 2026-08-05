import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from '../jwt.service';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    jwtService = {
      verifyToken: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    guard = new JwtAuthGuard(jwtService);
  });

  function createMockContext(authHeader?: string) {
    const request: Record<string, unknown> = { headers: {} };
    if (authHeader !== undefined) {
      (request.headers as Record<string, string>).authorization = authHeader;
    }
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
  }

  it('should throw UnauthorizedException when no auth header', () => {
    const context = createMockContext();

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when header is not Bearer', () => {
    const context = createMockContext('Basic abc123');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when token is invalid', () => {
    const context = createMockContext('Bearer invalid-token');
    jwtService.verifyToken.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should set user on request and return true for valid token', () => {
    const context = createMockContext('Bearer valid-token');
    jwtService.verifyToken.mockReturnValue({
      sub: '42',
      email: 'test@example.com',
      roles: ['User'],
    });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    const request = context.switchToHttp().getRequest();
    expect(request.user).toEqual({
      userId: 42,
      email: 'test@example.com',
      roles: ['User'],
    });
  });
});
