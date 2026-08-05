import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(reflector);
  });

  function createMockContext(roles?: string[]) {
    const request = { user: roles ? { roles } : undefined };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as any;
  }

  it('should allow access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext(['User']);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when required roles is empty', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    const context = createMockContext(['User']);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user has no roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['Admin']);
    const context = createMockContext();

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should deny access when user lacks required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['Admin']);
    const context = createMockContext(['User']);

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should allow access when user has required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['Admin']);
    const context = createMockContext(['Admin', 'User']);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has any of multiple required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['Admin', 'SuperDuperAdmin']);
    const context = createMockContext(['SuperDuperAdmin']);

    expect(guard.canActivate(context)).toBe(true);
  });
});
