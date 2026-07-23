import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export interface ActivityIdeaDto {
  id: number;
  name: string;
  description: string;
}

export class CreateActivityIdeaRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;
}
