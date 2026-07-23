import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsDateString,
  IsArray,
  IsIn,
  IsOptional,
} from 'class-validator';

export class RegisterRequest {
  @IsEmail()
  @MaxLength(256)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(100)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  pronouns: string;

  @IsDateString()
  birthday: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  interests: string;

  @IsArray()
  @IsString({ each: true })
  @IsIn(['closeFriends', 'romance', 'community', 'hobbies'], { each: true })
  lookingFor: string[];
}
