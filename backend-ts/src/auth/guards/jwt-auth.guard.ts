import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '../jwt.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    const token = authHeader.substring(7);

    try {
      const payload = this.jwtService.verifyToken(token);
      request.user = {
        userId: parseInt(payload.sub, 10),
        email: payload.email,
        roles: payload.roles,
      };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
