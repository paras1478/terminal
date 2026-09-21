import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString, MaxLength } from 'class-validator';

export class UpsertHomepageContentDto {
  @ApiProperty({ example: 'hero' })
  @IsString()
  @MaxLength(100)
  section!: string;

  @ApiProperty({
    example: {
      headline: 'Command Your Workflow with AI',
      ctaLabel: 'Get Started',
    },
  })
  @IsObject()
  content!: Record<string, unknown>;
}
