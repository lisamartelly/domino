import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(key: string): Promise<string | null> {
    const row = await this.prisma.appSetting.findUnique({ where: { key } });
    return row?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.prisma.appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async isRegistrationEnabled(): Promise<boolean> {
    const value = await this.get('registrationEnabled');
    return value !== 'false';
  }

  async setRegistrationEnabled(enabled: boolean): Promise<void> {
    await this.set('registrationEnabled', enabled ? 'true' : 'false');
  }
}
