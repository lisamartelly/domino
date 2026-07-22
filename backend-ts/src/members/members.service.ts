import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface MatchStatsDto {
  totalMatches: number;
  accepted: number;
  denied: number;
  pending: number;
}

export interface MemberDto {
  id: number;
  firstName: string;
  lastName: string;
  birthday: string;
  matchStats: MatchStatsDto;
}

interface PastMatchDto {
  matchPublicId: string;
  otherUserName: string;
  accepted: boolean | null;
  createdAt: Date;
}

export interface MemberDetailDto extends MemberDto {
  pastMatches: PastMatchDto[];
}

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(excludeUserId: number): Promise<MemberDto[]> {
    const adminRoleIds = await this.prisma.role
      .findMany({
        where: { name: { in: ['Admin', 'SuperDuperAdmin'] } },
        select: { id: true },
      })
      .then((roles) => roles.map((r) => r.id));

    const adminUserIds = await this.prisma.userRole
      .findMany({
        where: { roleId: { in: adminRoleIds } },
        select: { userId: true },
      })
      .then((urs) => urs.map((ur) => ur.userId));

    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        id: { notIn: [excludeUserId, ...adminUserIds] },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    const memberIds = users.map((u) => u.id);
    const matchUsers = await this.prisma.matchUser.findMany({
      where: { userId: { in: memberIds } },
    });

    const statsMap = new Map<number, MatchStatsDto>();
    for (const mu of matchUsers) {
      const stats = statsMap.get(mu.userId) ?? {
        totalMatches: 0,
        accepted: 0,
        denied: 0,
        pending: 0,
      };
      stats.totalMatches++;
      if (mu.accepted === true) stats.accepted++;
      else if (mu.accepted === false) stats.denied++;
      else stats.pending++;
      statsMap.set(mu.userId, stats);
    }

    return users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      birthday: u.birthday.toISOString().split('T')[0],
      matchStats: statsMap.get(u.id) ?? {
        totalMatches: 0,
        accepted: 0,
        denied: 0,
        pending: 0,
      },
    }));
  }

  async getById(id: number): Promise<MemberDetailDto | null> {
    const user = await this.prisma.user.findFirst({
      where: { id, isActive: true },
    });

    if (!user) return null;

    const matchUserRows = await this.prisma.matchUser.findMany({
      where: { userId: id },
    });

    const matchStats: MatchStatsDto = {
      totalMatches: matchUserRows.length,
      accepted: matchUserRows.filter((mu) => mu.accepted === true).length,
      denied: matchUserRows.filter((mu) => mu.accepted === false).length,
      pending: matchUserRows.filter((mu) => mu.accepted === null).length,
    };

    const recentMatchUsers = await this.prisma.matchUser.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        match: {
          include: {
            matchUsers: {
              where: { userId: { not: id } },
              include: { user: true },
            },
          },
        },
      },
    });

    const pastMatches: PastMatchDto[] = recentMatchUsers.map((mu) => {
      const otherUser = mu.match.matchUsers[0]?.user;
      const otherName = otherUser
        ? `${otherUser.firstName} ${otherUser.lastName.substring(0, 1)}.`
        : 'Unknown';

      return {
        matchPublicId: mu.match.publicId,
        otherUserName: otherName,
        accepted: mu.accepted,
        createdAt: mu.createdAt,
      };
    });

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      birthday: user.birthday.toISOString().split('T')[0],
      matchStats,
      pastMatches,
    };
  }
}
