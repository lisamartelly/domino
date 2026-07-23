import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '../generated/prisma/client';

interface StoredRefreshToken {
  TokenHash: string;
  ExpiresAt: string;
  TokenFamilyId: string;
}

const TOKEN_PROVIDER = 'RefreshToken';
const TOKEN_NAME = 'RefreshToken';

@Injectable()
export class RefreshTokenService {
  private readonly refreshTokenExpirationDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.refreshTokenExpirationDays = this.configService.get<number>(
      'JWT_REFRESH_TOKEN_EXPIRATION_DAYS',
      7,
    );
  }

  generateRefreshToken(): string {
    return randomBytes(32).toString('base64');
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('base64');
  }

  async storeRefreshToken(
    user: User,
    refreshToken: string,
    tokenFamilyId?: string,
  ): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(
      Date.now() + this.refreshTokenExpirationDays * 24 * 60 * 60 * 1000,
    );

    const storedToken: StoredRefreshToken = {
      TokenHash: tokenHash,
      ExpiresAt: expiresAt.toISOString(),
      TokenFamilyId: tokenFamilyId ?? crypto.randomUUID(),
    };

    const value = JSON.stringify(storedToken);

    // Upsert into user_tokens (matching ASP.NET Identity's SetAuthenticationTokenAsync)
    await this.prisma.userToken.upsert({
      where: {
        userId_loginProvider_name: {
          userId: user.id,
          loginProvider: TOKEN_PROVIDER,
          name: TOKEN_NAME,
        },
      },
      update: { value },
      create: {
        userId: user.id,
        loginProvider: TOKEN_PROVIDER,
        name: TOKEN_NAME,
        value,
      },
    });
  }

  async validateRefreshToken(
    refreshToken: string,
    userId: string,
  ): Promise<{
    isValid: boolean;
    user: User | null;
    tokenFamilyId: string | null;
  }> {
    const tokenHash = this.hashToken(refreshToken);
    const userIdNum = parseInt(userId, 10);

    if (isNaN(userIdNum)) {
      return { isValid: false, user: null, tokenFamilyId: null };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userIdNum },
    });

    if (!user) {
      return { isValid: false, user: null, tokenFamilyId: null };
    }

    const storedTokenRow = await this.prisma.userToken.findUnique({
      where: {
        userId_loginProvider_name: {
          userId: userIdNum,
          loginProvider: TOKEN_PROVIDER,
          name: TOKEN_NAME,
        },
      },
    });

    if (!storedTokenRow?.value) {
      return { isValid: false, user: null, tokenFamilyId: null };
    }

    let storedToken: StoredRefreshToken;
    try {
      storedToken = JSON.parse(storedTokenRow.value) as StoredRefreshToken;
    } catch {
      return { isValid: false, user: null, tokenFamilyId: null };
    }

    if (storedToken.TokenHash !== tokenHash) {
      return { isValid: false, user: null, tokenFamilyId: null };
    }

    if (new Date(storedToken.ExpiresAt) < new Date()) {
      await this.revokeRefreshToken(user);
      return { isValid: false, user: null, tokenFamilyId: null };
    }

    return {
      isValid: true,
      user,
      tokenFamilyId: storedToken.TokenFamilyId,
    };
  }

  async revokeRefreshToken(user: User): Promise<void> {
    await this.prisma.userToken.deleteMany({
      where: {
        userId: user.id,
        loginProvider: TOKEN_PROVIDER,
        name: TOKEN_NAME,
      },
    });
  }
}
