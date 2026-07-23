import { Module } from '@nestjs/common';
import { ActivityIdeasController } from './activity-ideas.controller';
import { ActivityIdeasService } from './activity-ideas.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ActivityIdeasController],
  providers: [ActivityIdeasService],
})
export class ActivityIdeasModule {}
