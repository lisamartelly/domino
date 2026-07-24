import { IsEmail, IsNotEmpty } from 'class-validator';

export class SubscribeRequest {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export interface SubscribeResponse {
  subscribed: boolean;
}

export interface NewsletterSubscriberDto {
  id: number;
  email: string;
  subscribedAt: string;
}
