import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TrackEventDto } from './dto/track-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async track(dto: TrackEventDto): Promise<{ accepted: true }> {
    await this.prisma.userEvent.create({
      data: {
        eventName: dto.eventName,
        properties: dto.properties as Prisma.InputJsonValue | undefined,
        sessionId: dto.sessionId,
        path: dto.path,
        referrer: dto.referrer,
      },
    });

    return { accepted: true };
  }
}
