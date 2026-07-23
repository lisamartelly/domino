import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  jti: string;
}

@Injectable()
export class JwtService {
  private readonly secretKey: string;
  private readonly issuer: string;
  private readonly audience: string;
  private readonly accessTokenExpirationMinutes: number;

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('JWT_SECRET_KEY')!;
    this.issuer = this.configService.get<string>(
      'JWT_ISSUER',
      'Domino.Backend',
    );
    this.audience = this.configService.get<string>(
      'JWT_AUDIENCE',
      'Domino.Frontend',
    );
    this.accessTokenExpirationMinutes = this.configService.get<number>(
      'JWT_ACCESS_TOKEN_EXPIRATION_MINUTES',
      15,
    );
  }

  generateAccessToken(user: {
    id: number;
    email: string;
    name: string;
    roles: string[];
  }): string {
    const payload: JwtPayload = {
      sub: user.id.toString(),
      email: user.email,
      roles: user.roles,
      jti: crypto.randomUUID(),
    };

    return jwt.sign(payload, this.secretKey, {
      issuer: this.issuer,
      audience: this.audience,
      expiresIn: `${this.accessTokenExpirationMinutes}m`,
    });
  }

  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, this.secretKey, {
      issuer: this.issuer,
      audience: this.audience,
    }) as JwtPayload;
  }
}
