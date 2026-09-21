import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDemoRequestDto } from './dto/create-demo-request.dto';
import { DemoRequestResponseDto } from './dto/demo-request-response.dto';

@Injectable()
export class DemoRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDemoRequestDto): Promise<DemoRequestResponseDto> {
    const request = await this.prisma.demoRequest.create({
      data: {
        name: dto.name,
        email: dto.email,
        company: dto.company,
        teamSize: dto.teamSize,
        preferredDate: dto.preferredDate
          ? new Date(dto.preferredDate)
          : undefined,
        notes: dto.notes,
      },
    });

    return {
      id: request.id,
      createdAt: request.createdAt,
    };
  }
}
