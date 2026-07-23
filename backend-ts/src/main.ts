import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { seedDatabase } from './seed';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  app.setGlobalPrefix('api');

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // In production, serve the frontend static build
  if (process.env.NODE_ENV === 'production') {
    const clientPath = join(__dirname, '..', '..', 'public');
    app.useStaticAssets(clientPath);

    // SPA fallback: serve index.html for any non-API route
    const express = app.getHttpAdapter().getInstance();
    express.get(/^\/(?!api\/).*/, (_req: unknown, res: { sendFile: (path: string) => void }) => {
      res.sendFile(join(clientPath, 'index.html'));
    });
  }

  // Seed database on startup (idempotent — skips if data exists)
  const prisma = app.get(PrismaService);
  await seedDatabase(prisma);

  const port = process.env.PORT || 5297;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
