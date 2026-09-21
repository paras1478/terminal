import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactSubmissionDto } from './dto/create-contact-submission.dto';
import { ContactSubmissionResponseDto } from './dto/contact-submission-response.dto';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateContactSubmissionDto,
  ): Promise<ContactSubmissionResponseDto> {
    const submission = await this.prisma.contactSubmission.create({
      data: {
        name: dto.name,
        email: dto.email,
        subject: dto.subject,
        message: dto.message,
      },
    });

    return {
      id: submission.id,
      createdAt: submission.createdAt,
    };
  }
}
