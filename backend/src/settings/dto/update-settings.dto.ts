import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ALLOWED_MODEL_IDS } from '../../ai/model-catalog';
import { IsValidApiKeyMap } from './is-valid-api-key-map.validator';

const ALLOWED_THEMES = ['dark', 'light', 'system'];
const ALLOWED_MODELS = ALLOWED_MODEL_IDS;

export class UpdateSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  confirmationRequired?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  allowedPatterns?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  dangerousBlocklist?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  maxStepsPerTask?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(7200)
  maxRuntimeSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  maxConcurrentSessions?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyOnCompletion?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyOnFailure?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyByEmail?: boolean;

  @ApiPropertyOptional({ enum: ALLOWED_THEMES })
  @IsOptional()
  @IsIn(ALLOWED_THEMES)
  theme?: string;

  @ApiPropertyOptional({ enum: ALLOWED_MODELS })
  @IsOptional()
  @IsIn(ALLOWED_MODELS)
  modelSelection?: string;

  @ApiPropertyOptional({
    type: Object,
    description:
      'Map of provider name to API key. Keys are stored server-side only.',
  })
  @IsOptional()
  @IsValidApiKeyMap()
  apiKeys?: Record<string, string>;
}
