import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export interface QuestionOptionDto {
  id: number;
  value: string;
  displayValue: string;
  sortOrder: number;
}

export interface QuestionDto {
  questionVersionId: number;
  stableKey: string;
  questionGroup: string | null;
  prompt: string;
  questionType: string;
  required: boolean;
  options: QuestionOptionDto[];
}

export interface SurveyDto {
  id: number;
  name: string;
  slug: string;
  description: string;
  versionId: number;
  questions: QuestionDto[];
}

export interface SurveyAnswerDto {
  prompt: string;
  questionGroup: string | null;
  questionType: string;
  answer: string | null;
}

export interface SurveyResponseDto {
  surveyName: string;
  completedAt: Date;
  answers: SurveyAnswerDto[];
}

export class SubmitAnswerRequest {
  @IsInt()
  questionVersionId: number;

  @IsOptional()
  @IsString()
  textValue?: string;

  @IsOptional()
  @IsNumber()
  numberValue?: number;

  @IsOptional()
  @IsBoolean()
  booleanValue?: boolean;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  selectedOptionIds?: number[];
}

export class SubmitSurveyRequest {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerRequest)
  answers: SubmitAnswerRequest[];
}
