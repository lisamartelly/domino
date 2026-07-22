import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { ActivityIdeasModule } from './activity-ideas/activity-ideas.module';
import { MembersModule } from './members/members.module';
import { SurveysModule } from './surveys/surveys.module';
import { MatchesModule } from './matches/matches.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    ActivityIdeasModule,
    MembersModule,
    SurveysModule,
    MatchesModule,
  ],
})
export class AppModule {}
