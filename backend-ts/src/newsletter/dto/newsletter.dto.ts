import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubscribeRequest {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string;
}

export interface SubscribeResponse {
  subscribed: boolean;
}

export interface NewsletterSubscriberDto {
  id: number;
  email: string;
  source: string;
  subscribedAt: string;
}
