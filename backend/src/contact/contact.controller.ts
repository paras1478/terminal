import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { CreateContactSubmissionDto } from './dto/create-contact-submission.dto';
import { ContactSubmissionResponseDto } from './dto/contact-submission-response.dto';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Submit a contact form message' })
  @ApiResponse({ status: 201, type: ContactSubmissionResponseDto })
  create(
    @Body() dto: CreateContactSubmissionDto,
  ): Promise<ContactSubmissionResponseDto> {
    return this.contactService.create(dto);
  }
}
