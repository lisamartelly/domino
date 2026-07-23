import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('members')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin', 'SuperDuperAdmin')
export class MembersController {
  constructor(private readonly service: MembersService) {}

  @Get()
  async list(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.service.list(currentUser.userId);
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    const detail = await this.service.getById(id);
    if (!detail) {
      throw new NotFoundException();
    }
    return detail;
  }
}
