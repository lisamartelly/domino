import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import type { AuthResult } from './auth.service';
import { RegisterRequest, LoginRequest } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthenticatedUser } from './decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';

const UNAUTHORIZED_MESSAGES = new Set([
  'Invalid email or password',
  'Account is locked. Please try again later.',
]);

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(
    @Body() request: RegisterRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(request);
    return this.sendAuthResult(res, result, HttpStatus.BAD_REQUEST);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() request: LoginRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(
      request.email,
      request.password,
    );

    if (!result.response.success) {
      const status = UNAUTHORIZED_MESSAGES.has(result.response.message ?? '')
        ? HttpStatus.UNAUTHORIZED
        : HttpStatus.BAD_REQUEST;
      res.status(status);
      return result.response;
    }

    return this.sendAuthResult(res, result);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refresh(req.cookies?.refreshToken);

    if (!result.success) {
      res.status(HttpStatus.UNAUTHORIZED);
      return { message: result.message };
    }

    if (result.refreshCookieValue) {
      this.setRefreshTokenCookie(res, result.refreshCookieValue);
    }

    return {
      message: result.message,
      accessToken: result.accessToken,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(req.cookies?.refreshToken);
    res.clearCookie('refreshToken', { path: '/api/auth' });
    return { message: 'Logout successful' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() currentUser: AuthenticatedUser) {
    const user = await this.authService.getCurrentUser(currentUser.userId);

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  private sendAuthResult(
    res: Response,
    result: AuthResult,
    failureStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    if (!result.response.success) {
      res.status(failureStatus);
      return result.response;
    }

    if (result.refreshCookieValue) {
      this.setRefreshTokenCookie(res, result.refreshCookieValue);
    }

    return result.response;
  }

  private setRefreshTokenCookie(res: Response, value: string): void {
    const expirationDays = this.configService.get<number>(
      'JWT_REFRESH_TOKEN_EXPIRATION_DAYS',
      7,
    );

    res.cookie('refreshToken', value, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
      path: '/api/auth',
      maxAge: expirationDays * 24 * 60 * 60 * 1000,
    });
  }
}
