import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';
import { RefreshTokenService } from './refresh-token.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtService,
    RefreshTokenService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [JwtService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
