import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { SubscribeRequest } from './dto/newsletter.dto';
import type { SubscribeResponse, NewsletterSubscriberDto } from './dto/newsletter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly service: NewsletterService) {}

  @Post('subscribe')
  async subscribe(@Body() body: SubscribeRequest): Promise<SubscribeResponse> {
    const isNew = await this.service.subscribe(body.email);
    return { subscribed: isNew };
  }

  @Get('subscribers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'SuperDuperAdmin')
  async list(): Promise<NewsletterSubscriberDto[]> {
    return this.service.list();
  }
}
