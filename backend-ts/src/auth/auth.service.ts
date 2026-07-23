import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from './jwt.service';
import { RefreshTokenService } from './refresh-token.service';
import type { RegisterRequest, LoginResponse, UserDto } from './dto';
import type { User } from '../generated/prisma/client';

const SALT_ROUNDS = 12;

export interface AuthResult {
  response: LoginResponse;
  refreshCookieValue: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async register(request: RegisterRequest): Promise<AuthResult> {
    const existingUser = await this.prisma.user.findFirst({
      where: { normalizedEmail: request.email.toUpperCase() },
    });

    if (existingUser) {
      return this.failedAuthResult('Registration failed');
    }

    const passwordHash = await bcrypt.hash(request.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        userName: request.email,
        normalizedUserName: request.email.toUpperCase(),
        email: request.email,
        normalizedEmail: request.email.toUpperCase(),
        emailConfirmed: false,
        firstName: request.firstName,
        lastName: request.lastName,
        birthday: new Date(request.birthday),
        isActive: true,
        passwordHash,
        securityStamp: crypto.randomUUID(),
        concurrencyStamp: crypto.randomUUID(),
        phoneNumberConfirmed: false,
        twoFactorEnabled: false,
        lockoutEnabled: true,
        accessFailedCount: 0,
      },
    });

    // Assign "User" role
    const userRole = await this.prisma.role.findFirst({
      where: { normalizedName: 'USER' },
    });

    if (userRole) {
      await this.prisma.userRole.create({
        data: { userId: user.id, roleId: userRole.id },
      });
    }

    const roles = userRole ? ['User'] : [];

    return this.successAuthResult(user, roles, false, 'Registration successful');
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.prisma.user.findFirst({
      where: { normalizedEmail: email.toUpperCase() },
    });

    if (!user || !user.isActive) {
      return this.failedAuthResult('Invalid email or password');
    }

    if (this.isLockedOut(user)) {
      return this.failedAuthResult(
        'Account is locked. Please try again later.',
      );
    }

    const passwordValid = user.passwordHash
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!passwordValid) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { accessFailedCount: { increment: 1 } },
      });
      return this.failedAuthResult('Invalid email or password');
    }

    // Reset access failed count on successful login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { accessFailedCount: 0, lockoutEnd: null },
    });

    const roles = await this.getUserRoles(user.id);
    const hasCompletedIntake = await this.hasCompletedIntake(user.id, roles);

    return this.successAuthResult(user, roles, hasCompletedIntake, 'Login successful');
  }

  async refresh(
    refreshCookie: string | undefined,
  ): Promise<{
    success: boolean;
    message: string;
    accessToken?: string;
    refreshCookieValue?: string;
  }> {
    if (!refreshCookie) {
      return { success: false, message: 'Refresh token not found' };
    }

    const separatorIndex = refreshCookie.indexOf(':');
    if (separatorIndex < 1) {
      return { success: false, message: 'Invalid refresh token format' };
    }

    const userId = refreshCookie.substring(0, separatorIndex);
    const refreshToken = refreshCookie.substring(separatorIndex + 1);

    const { isValid, user, tokenFamilyId } =
      await this.refreshTokenService.validateRefreshToken(refreshToken, userId);

    if (!isValid || !user) {
      return { success: false, message: 'Invalid or expired refresh token' };
    }

    if (!user.isActive) {
      await this.refreshTokenService.revokeRefreshToken(user);
      return { success: false, message: 'Account is inactive' };
    }

    const roles = await this.getUserRoles(user.id);
    const newAccessToken = this.jwtService.generateAccessToken({
      id: user.id,
      email: user.email!,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
    });

    const newRefreshToken = this.refreshTokenService.generateRefreshToken();
    await this.refreshTokenService.storeRefreshToken(
      user,
      newRefreshToken,
      tokenFamilyId ?? undefined,
    );

    return {
      success: true,
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
      refreshCookieValue: `${user.id}:${newRefreshToken}`,
    };
  }

  async logout(refreshCookie: string | undefined): Promise<void> {
    if (!refreshCookie) return;

    const separatorIndex = refreshCookie.indexOf(':');
    if (separatorIndex < 1) return;

    const userIdNum = parseInt(refreshCookie.substring(0, separatorIndex), 10);
    if (isNaN(userIdNum)) return;

    const user = await this.prisma.user.findUnique({
      where: { id: userIdNum },
    });

    if (user) {
      await this.refreshTokenService.revokeRefreshToken(user);
    }
  }

  async getCurrentUser(userId: number): Promise<UserDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const roles = await this.getUserRoles(user.id);
    const hasCompletedIntake = await this.hasCompletedIntake(user.id, roles);

    return this.buildUserDto(user, roles, hasCompletedIntake);
  }

  // ── Helpers ──────────────────────────────────────────────

  private failedAuthResult(message: string): AuthResult {
    return {
      response: { success: false, message },
      refreshCookieValue: '',
    };
  }

  private async successAuthResult(
    user: User,
    roles: string[],
    hasCompletedIntake: boolean,
    message: string,
  ): Promise<AuthResult> {
    const accessToken = this.jwtService.generateAccessToken({
      id: user.id,
      email: user.email!,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
    });

    const refreshToken = this.refreshTokenService.generateRefreshToken();
    await this.refreshTokenService.storeRefreshToken(user, refreshToken);

    return {
      response: {
        success: true,
        message,
        accessToken,
        user: this.buildUserDto(user, roles, hasCompletedIntake),
      },
      refreshCookieValue: `${user.id}:${refreshToken}`,
    };
  }

  private buildUserDto(
    user: User,
    roles: string[],
    hasCompletedIntake: boolean,
  ): UserDto {
    return {
      id: user.id,
      email: user.email!,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      hasCompletedIntake,
    };
  }

  private isLockedOut(user: User): boolean {
    return !!(
      user.lockoutEnabled &&
      user.lockoutEnd &&
      new Date(user.lockoutEnd) > new Date()
    );
  }

  private async getUserRoles(userId: number): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    return userRoles.map((ur) => ur.role.name!).filter(Boolean);
  }

  private async hasCompletedIntake(
    userId: number,
    roles: string[],
  ): Promise<boolean> {
    if (roles.includes('Admin') || roles.includes('SuperDuperAdmin')) {
      return true;
    }

    const response = await this.prisma.surveyResponse.findFirst({
      where: {
        userId,
        surveyVersion: {
          survey: { slug: 'intake' },
        },
      },
    });

    return !!response;
  }
}
