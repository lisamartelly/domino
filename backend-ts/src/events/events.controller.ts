import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { EventsService } from './events.service';
import { CreateEventRequest, UpdateEventRequest } from './dto/event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { sendResult } from '../common/send-result';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly service: EventsService) {}

  // ── User-facing endpoints ──

  @Get()
  async listPublished() {
    return this.service.listPublished();
  }

  @Get('my-registrations')
  async myRegistrations(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getMyRegistrations(user.userId);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('Admin', 'SuperDuperAdmin')
  async listAll() {
    return this.service.listAll();
  }

  @Get(':id')
  async getById(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.getById(id);
    return sendResult(res, result);
  }

  // ── Registration ──

  @Post(':id/register')
  async register(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.register(id, user.userId, user.email);
    return sendResult(res, result);
  }

  @Delete(':id/register')
  @HttpCode(HttpStatus.OK)
  async cancelRegistration(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.cancelRegistration(id, user.userId);
    return sendResult(res, result);
  }

  // ── Admin endpoints ──

  @Post()
  @UseGuards(RolesGuard)
  @Roles('Admin', 'SuperDuperAdmin')
  async create(
    @Body() request: CreateEventRequest,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(request, user.userId);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin', 'SuperDuperAdmin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdateEventRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.update(id, request);
    return sendResult(res, result);
  }

  @Patch(':id/publish')
  @UseGuards(RolesGuard)
  @Roles('Admin', 'SuperDuperAdmin')
  async publish(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.publish(id);
    return sendResult(res, result);
  }

  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles('Admin', 'SuperDuperAdmin')
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.cancel(id);
    return sendResult(res, result);
  }
}
