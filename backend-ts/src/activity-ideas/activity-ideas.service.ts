import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { ServiceResult } from '../common/service-result';
import { success, notFound } from '../common/service-result';
import type { ActivityIdeaDto } from './dto/activity-idea.dto';

@Injectable()
export class ActivityIdeasService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<ActivityIdeaDto[]> {
    const ideas = await this.prisma.activityIdea.findMany({
      orderBy: { name: 'asc' },
    });
    return ideas.map((a) => ({ id: a.id, name: a.name, description: a.description }));
  }

  async create(name: string, description: string): Promise<ActivityIdeaDto> {
    const idea = await this.prisma.activityIdea.create({
      data: { name, description },
    });
    return { id: idea.id, name: idea.name, description: idea.description };
  }

  async update(
    id: number,
    name: string,
    description: string,
  ): Promise<ServiceResult<ActivityIdeaDto>> {
    const idea = await this.prisma.activityIdea.findUnique({ where: { id } });
    if (!idea) {
      return notFound('Activity idea not found.');
    }

    const updated = await this.prisma.activityIdea.update({
      where: { id },
      data: { name, description },
    });

    return success({
      id: updated.id,
      name: updated.name,
      description: updated.description,
    });
  }

  async delete(id: number): Promise<ServiceResult<boolean>> {
    const idea = await this.prisma.activityIdea.findUnique({ where: { id } });
    if (!idea) {
      return notFound('Activity idea not found.');
    }

    await this.prisma.activityIdea.delete({ where: { id } });
    return success(true);
  }
}
