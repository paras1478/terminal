import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertHomepageContentDto } from './dto/upsert-homepage-content.dto';
import { HomepageContentResponseDto } from './dto/homepage-content-response.dto';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<HomepageContentResponseDto[]> {
    const sections = await this.prisma.homepageContent.findMany({
      orderBy: { section: 'asc' },
    });

    return sections.map((section) => ({
      section: section.section,
      content: section.content as Record<string, unknown>,
      updatedAt: section.updatedAt,
    }));
  }

  async findOne(section: string): Promise<HomepageContentResponseDto> {
    const found = await this.prisma.homepageContent.findUnique({
      where: { section },
    });
    if (!found) {
      throw new NotFoundException(`No content found for section "${section}"`);
    }

    return {
      section: found.section,
      content: found.content as Record<string, unknown>,
      updatedAt: found.updatedAt,
    };
  }

  async upsert(
    dto: UpsertHomepageContentDto,
  ): Promise<HomepageContentResponseDto> {
    const content = dto.content as Prisma.InputJsonValue;

    const saved = await this.prisma.homepageContent.upsert({
      where: { section: dto.section },
      create: { section: dto.section, content },
      update: { content },
    });

    return {
      section: saved.section,
      content: saved.content as Record<string, unknown>,
      updatedAt: saved.updatedAt,
    };
  }
}
