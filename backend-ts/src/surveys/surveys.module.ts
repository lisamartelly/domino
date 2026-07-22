import { Module } from '@nestjs/common';
import { SurveysController } from './surveys.controller';
import { SurveysService } from './surveys.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SurveysController],
  providers: [SurveysService],
})
export class SurveysModule {}
