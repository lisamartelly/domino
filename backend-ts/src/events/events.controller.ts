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
import {
  CreateEventRequest,
  UpdateEventRequest,
  SubmitEventInterestRequest,
} from './dto/event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { sendResult } from '../common/send-result';

@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

  // ── Public endpoints (no auth) ──

  @Get()
  async listPublished() {
    return this.service.listPublished();
  }

  // Static paths MUST come before :id to avoid being swallowed by the param route

  @Get('featured')
  async listFeatured() {
    return this.service.listFeatured();
  }

  @Get('my-registrations')
  @UseGuards(JwtAuthGuard)
  async myRegistrations(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getMyRegistrations(user.userId);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
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

  // ── Interest sign-up (public, no auth) ──

  @Post(':id/interest')
  @HttpCode(HttpStatus.OK)
  async submitInterest(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: SubmitEventInterestRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.submitInterest(id, body);
    return sendResult(res, result);
  }

  // ── Interest list (admin only) ──

  @Get(':id/interests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'SuperDuperAdmin')
  async getInterests(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.getInterests(id);
    return sendResult(res, result);
  }

  // ── Registration (auth required) ──

  @Post(':id/register')
  @UseGuards(JwtAuthGuard)
  async register(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.register(id, user.userId, user.email);
    return sendResult(res, result);
  }

  @Delete(':id/register')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'SuperDuperAdmin')
  async create(
    @Body() request: CreateEventRequest,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(request, user.userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'SuperDuperAdmin')
  async publish(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.publish(id);
    return sendResult(res, result);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'SuperDuperAdmin')
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.cancel(id);
    return sendResult(res, result);
  }

  @Patch(':id/feature')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'SuperDuperAdmin')
  async setFeatured(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { featured: boolean },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.setFeatured(id, body.featured);
    return sendResult(res, result);
  }
}
