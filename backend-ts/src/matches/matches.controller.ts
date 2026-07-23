import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { MatchesService } from './matches.service';
import { CreateMatchRequest, RespondToMatchRequest } from './dto/match.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { sendResult } from '../common/send-result';

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchesController {
  constructor(private readonly service: MatchesService) {}

  @Get()
  async list(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.service.listForUser(currentUser.userId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('Admin', 'SuperDuperAdmin')
  async create(
    @Body() request: CreateMatchRequest,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.create(request, currentUser.userId);
    if (result.kind !== 'success') {
      return sendResult(res, result);
    }

    res.status(HttpStatus.CREATED);
    return { publicId: result.value };
  }

  @Get(':publicId')
  async get(
    @Param('publicId') publicId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const isAdmin =
      currentUser.roles.includes('Admin') ||
      currentUser.roles.includes('SuperDuperAdmin');
    const result = await this.service.get(
      publicId,
      currentUser.userId,
      isAdmin,
    );
    return sendResult(res, result);
  }

  @Post(':publicId/respond')
  async respond(
    @Param('publicId') publicId: string,
    @Body() request: RespondToMatchRequest,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.respond(
      publicId,
      currentUser.userId,
      request.accepted,
    );
    return sendResult(res, result);
  }
}
