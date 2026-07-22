import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsIn,
  MaxLength,
  Min,
  IsDateString,
} from 'class-validator';

// ── Response DTOs ──

export interface EventOccurrenceDto {
  id: number;
  startTime: string;
  endTime: string;
  isCancelled: boolean;
}

export interface EventDto {
  id: number;
  name: string;
  description: string;
  location: string;
  costCents: number;
  capacity: number | null;
  startTime: string;
  durationMinutes: number;
  frequencyType: string;
  frequencyCount: number;
  status: string;
  registrationCount: number;
  occurrences: EventOccurrenceDto[];
  createdAt: string;
}

export interface EventSummaryDto {
  id: number;
  name: string;
  description: string;
  location: string;
  costCents: number;
  capacity: number | null;
  startTime: string;
  durationMinutes: number;
  frequencyType: string;
  frequencyCount: number;
  status: string;
  registrationCount: number;
  spotsRemaining: number | null;
}

export interface EventRegistrationDto {
  id: number;
  eventId: number;
  eventName: string;
  status: string;
  pricePaidCents: number;
  registeredAt: string;
}

export interface RegisterEventResponseDto {
  registered: boolean;
  checkoutUrl?: string;
}

// ── Request DTOs ──

export class CreateEventRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  location: string;

  @IsInt()
  @Min(0)
  costCents: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsDateString()
  startTime: string;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsString()
  @IsIn(['ONCE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'])
  frequencyType: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  frequencyCount?: number;
}

export class UpdateEventRequest {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  costCents?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number | null;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  @IsIn(['ONCE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'])
  frequencyType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  frequencyCount?: number;
}
