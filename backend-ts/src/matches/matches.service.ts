import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { ServiceResult } from '../common/service-result';
import { success, notFound, invalid } from '../common/service-result';
import type {
  MatchSummaryDto,
  MatchDetailDto,
  RespondResult,
  CreateMatchRequest,
} from './dto/match.dto';

const MATCH_EXPIRY_HOURS = 24;
const PUBLIC_ID_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function generatePublicId(length = 10): string {
  const bytes = randomBytes(length);
  return Array.from(bytes)
    .map((b) => PUBLIC_ID_CHARS[b % PUBLIC_ID_CHARS.length])
    .join('');
}

function calculateAge(birthday: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const monthDiff = today.getMonth() - birthday.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthday.getDate())
  ) {
    age--;
  }
  return age;
}

function computeMatchStatus(
  createdAt: Date,
  matchUsers: { accepted: boolean | null }[],
): string {
  const isExpired =
    new Date().getTime() - createdAt.getTime() > MATCH_EXPIRY_HOURS * 3600000;

  if (isExpired && matchUsers.some((mu) => mu.accepted === null)) {
    return 'expired';
  }
  if (matchUsers.every((mu) => mu.accepted === true)) return 'accepted';
  if (matchUsers.some((mu) => mu.accepted === false)) return 'denied';
  return 'pending';
}

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: number): Promise<MatchSummaryDto[]> {
    const matchUsers = await this.prisma.matchUser.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        match: {
          include: {
            matchUsers: {
              include: { user: true },
            },
          },
        },
      },
    });

    return matchUsers.map((mu) => {
      const otherUser = mu.match.matchUsers.find(
        (m) => m.userId !== userId,
      )?.user;
      const otherName = otherUser
        ? `${otherUser.firstName} ${otherUser.lastName.substring(0, 1)}.`
        : 'Unknown';

      return {
        publicId: mu.match.publicId,
        otherUserName: otherName,
        status: computeMatchStatus(mu.match.createdAt, mu.match.matchUsers),
        createdAt: mu.createdAt,
      };
    });
  }

  async create(
    request: CreateMatchRequest,
    createdByUserId: number,
  ): Promise<ServiceResult<string>> {
    if (request.userId1 === request.userId2) {
      return invalid('Cannot match a user with themselves.');
    }

    if (new Set(request.activityIdeaIds).size !== 3) {
      return invalid('Activity ideas must be unique.');
    }

    const [user1, user2] = await Promise.all([
      this.prisma.user.findFirst({
        where: { id: request.userId1, isActive: true },
      }),
      this.prisma.user.findFirst({
        where: { id: request.userId2, isActive: true },
      }),
    ]);

    if (!user1 || !user2) {
      return invalid('One or both users not found.');
    }

    const validIdeaCount = await this.prisma.activityIdea.count({
      where: { id: { in: request.activityIdeaIds } },
    });

    if (validIdeaCount !== 3) {
      return invalid('One or more activity ideas not found.');
    }

    const publicId = generatePublicId();

    const match = await this.prisma.match.create({
      data: {
        publicId,
        narrative: request.narrative,
        createdByUserId,
      },
    });

    await this.prisma.matchUser.createMany({
      data: [
        { matchId: match.id, userId: request.userId1 },
        { matchId: match.id, userId: request.userId2 },
      ],
    });

    await this.prisma.matchActivityIdea.createMany({
      data: request.activityIdeaIds.map((ideaId) => ({
        matchId: match.id,
        activityIdeaId: ideaId,
      })),
    });

    return success(publicId);
  }

  async get(
    publicId: string,
    currentUserId: number,
    isAdmin: boolean,
  ): Promise<ServiceResult<MatchDetailDto>> {
    const match = await this.prisma.match.findUnique({
      where: { publicId },
      include: {
        matchUsers: { include: { user: true } },
        matchActivityIdeas: { include: { activityIdea: true } },
      },
    });

    if (!match) {
      return notFound('Match not found.');
    }

    const isParticipant = match.matchUsers.some(
      (mu) => mu.userId === currentUserId,
    );
    if (!isParticipant && !isAdmin) {
      return notFound('Match not found.');
    }

    const isExpired =
      new Date().getTime() - match.createdAt.getTime() >
      MATCH_EXPIRY_HOURS * 3600000;
    const bothAccepted = match.matchUsers.every(
      (mu) => mu.accepted === true,
    );

    const users = match.matchUsers.map((mu) => ({
      userId: mu.userId,
      firstName: mu.user.firstName,
      lastInitial:
        mu.user.lastName.length > 0
          ? `${mu.user.lastName.substring(0, 1)}.`
          : '',
      age: calculateAge(mu.user.birthday),
      accepted: mu.accepted,
    }));

    return success({
      publicId: match.publicId,
      narrative: match.narrative,
      users,
      isExpired,
      bothAccepted,
      activityIdeas: bothAccepted
        ? match.matchActivityIdeas.map((mai) => ({
            id: mai.activityIdea.id,
            name: mai.activityIdea.name,
            description: mai.activityIdea.description,
          }))
        : [],
      createdAt: match.createdAt,
      currentUserAccepted:
        match.matchUsers.find((mu) => mu.userId === currentUserId)
          ?.accepted ?? null,
    });
  }

  async respond(
    publicId: string,
    currentUserId: number,
    accepted: boolean,
  ): Promise<ServiceResult<RespondResult>> {
    const match = await this.prisma.match.findUnique({
      where: { publicId },
      include: { matchUsers: true },
    });

    if (!match) {
      return notFound('Match not found.');
    }

    const matchUser = match.matchUsers.find(
      (mu) => mu.userId === currentUserId,
    );
    if (!matchUser) {
      return notFound('Match not found.');
    }

    const isExpired =
      new Date().getTime() - match.createdAt.getTime() >
      MATCH_EXPIRY_HOURS * 3600000;
    if (isExpired) {
      return invalid(
        'This match has expired. Responses are no longer accepted.',
      );
    }

    if (matchUser.accepted !== null) {
      return invalid('You have already responded to this match.');
    }

    await this.prisma.matchUser.update({
      where: { id: matchUser.id },
      data: { accepted },
    });

    // Re-check all match users for bothAccepted
    const updatedMatchUsers = match.matchUsers.map((mu) =>
      mu.id === matchUser.id ? { ...mu, accepted } : mu,
    );
    const bothAccepted = updatedMatchUsers.every(
      (mu) => mu.accepted === true,
    );

    return success({ accepted, bothAccepted });
  }
}
