import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { AI_PROVIDERS } from '../../ai/model-catalog';

const ALLOWED_PROVIDERS = AI_PROVIDERS.map((p) => p.id);

export class ValidateApiKeyDto {
  @ApiProperty({ enum: ALLOWED_PROVIDERS })
  @IsIn(ALLOWED_PROVIDERS)
  provider!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  apiKey!: string;
}
