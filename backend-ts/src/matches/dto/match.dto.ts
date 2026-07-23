import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
} from 'class-validator';

export class CreateMatchRequest {
  @IsInt()
  userId1: number;

  @IsInt()
  userId2: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  narrative: string;

  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @IsInt({ each: true })
  activityIdeaIds: number[];
}

export class RespondToMatchRequest {
  @IsBoolean()
  accepted: boolean;
}

export interface MatchSummaryDto {
  publicId: string;
  otherUserName: string;
  status: string;
  createdAt: Date;
}

export interface MatchUserDto {
  userId: number;
  firstName: string;
  lastInitial: string;
  age: number;
  accepted: boolean | null;
}

export interface MatchActivityIdeaDto {
  id: number;
  name: string;
  description: string;
}

export interface MatchDetailDto {
  publicId: string;
  narrative: string;
  users: MatchUserDto[];
  isExpired: boolean;
  bothAccepted: boolean;
  activityIdeas: MatchActivityIdeaDto[];
  createdAt: Date;
  currentUserAccepted: boolean | null;
}

export interface RespondResult {
  accepted: boolean;
  bothAccepted: boolean;
}
