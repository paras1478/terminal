import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWaitlistEntryDto } from './dto/create-waitlist-entry.dto';
import { WaitlistEntryResponseDto } from './dto/waitlist-entry-response.dto';

@Injectable()
export class WaitlistService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWaitlistEntryDto): Promise<WaitlistEntryResponseDto> {
    const existing = await this.prisma.waitlistEntry.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('This email is already on the waitlist');
    }

    const entry = await this.prisma.waitlistEntry.create({
      data: {
        email: dto.email,
        name: dto.name,
        company: dto.company,
        useCase: dto.useCase,
      },
    });

    return {
      id: entry.id,
      email: entry.email,
      createdAt: entry.createdAt,
    };
  }
}
