import {
  Controller,
  Get,
  Post,
  Put,
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
import { ActivityIdeasService } from './activity-ideas.service';
import { CreateActivityIdeaRequest } from './dto/activity-idea.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { sendResult } from '../common/send-result';

@Controller('activity-ideas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin', 'SuperDuperAdmin')
export class ActivityIdeasController {
  constructor(private readonly service: ActivityIdeasService) {}

  @Get()
  async list() {
    return this.service.list();
  }

  @Post()
  async create(@Body() request: CreateActivityIdeaRequest) {
    const dto = await this.service.create(request.name, request.description);
    return dto;
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: CreateActivityIdeaRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.update(id, request.name, request.description);
    return sendResult(res, result);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.delete(id);
    if (result.kind === 'not_found') {
      res.status(HttpStatus.NOT_FOUND);
      return;
    }
  }
}
