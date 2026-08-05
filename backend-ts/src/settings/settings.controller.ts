import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /** Public — lets the auth page know whether to show the register form. */
  @Get('registration')
  async getRegistrationStatus() {
    const enabled = await this.settingsService.isRegistrationEnabled();
    return { registrationEnabled: enabled };
  }

  /** Admin-only — toggle registration on or off. */
  @Patch('registration')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'SuperDuperAdmin')
  @HttpCode(HttpStatus.OK)
  async setRegistrationStatus(
    @Body() body: { registrationEnabled: boolean },
  ) {
    await this.settingsService.setRegistrationEnabled(body.registrationEnabled);
    return { registrationEnabled: body.registrationEnabled };
  }
}
