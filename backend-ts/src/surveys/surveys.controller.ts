import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { SurveysService } from './surveys.service';
import { SubmitSurveyRequest } from './dto/survey.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { sendResult } from '../common/send-result';

@Controller('surveys')
@UseGuards(JwtAuthGuard)
export class SurveysController {
  constructor(private readonly service: SurveysService) {}

  @Get(':slug')
  async getBySlug(
    @Param('slug') slug: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.getBySlug(slug);
    return sendResult(res, result);
  }

  @Post(':slug/responses')
  async submitResponse(
    @Param('slug') slug: string,
    @Body() request: SubmitSurveyRequest,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.submitResponse(
      slug,
      currentUser.userId,
      request.answers,
    );

    if (result.kind !== 'success') {
      return sendResult(res, result);
    }

    return { success: true };
  }

  @Get(':slug/responses/:userId')
  @UseGuards(RolesGuard)
  @Roles('Admin', 'SuperDuperAdmin')
  async getUserResponse(
    @Param('slug') slug: string,
    @Param('userId', ParseIntPipe) userId: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.getUserResponse(slug, userId);
    return sendResult(res, result);
  }
}
