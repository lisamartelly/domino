import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsIn,
  IsBoolean,
  IsEmail,
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
  startTime: string | null;
  durationMinutes: number;
  frequencyType: string;
  frequencyCount: number;
  status: string;
  phase: string;
  anticipatedPriceRange: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  registrationCount: number;
  interestCount: number;
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
  startTime: string | null;
  durationMinutes: number;
  frequencyType: string;
  frequencyCount: number;
  status: string;
  phase: string;
  anticipatedPriceRange: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  registrationCount: number;
  interestCount: number;
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

  @IsOptional()
  @IsDateString()
  startTime?: string;

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

  @IsOptional()
  @IsString()
  @IsIn(['gathering', 'scheduled'])
  phase?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  anticipatedPriceRange?: string;
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

  @IsOptional()
  @IsString()
  @IsIn(['gathering', 'scheduled'])
  phase?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  anticipatedPriceRange?: string;
}

// ── Interest sign-up ──

export interface EventInterestDto {
  id: number;
  eventId: number;
  name: string | null;
  email: string;
  openToRomance: boolean;
  aboutMe: string;
  createdAt: string;
}

export class SubmitEventInterestRequest {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @IsEmail()
  @MaxLength(256)
  email: string;

  @IsBoolean()
  openToRomance: boolean;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  aboutMe: string;
}
