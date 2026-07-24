import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { ActivityIdeasModule } from './activity-ideas/activity-ideas.module';
import { MembersModule } from './members/members.module';
import { SurveysModule } from './surveys/surveys.module';
import { MatchesModule } from './matches/matches.module';
import { StripeModule } from './stripe/stripe.module';
import { EventsModule } from './events/events.module';
import { NewsletterModule } from './newsletter/newsletter.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    StripeModule,
    HealthModule,
    AuthModule,
    ActivityIdeasModule,
    MembersModule,
    SurveysModule,
    MatchesModule,
    EventsModule,
    NewsletterModule,
  ],
})
export class AppModule {}
