import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // The default pingCheck timeout (1000ms) is shorter than this MongoDB
      // Atlas cluster's typical round-trip latency, so this check was
      // reporting "down" (and this endpoint 503ing) even when the database
      // connection was perfectly fine — confirmed via PrismaService's own
      // successful "Connected to database" log at boot, moments before this
      // same check timed out. 5s comfortably covers normal Atlas latency
      // while still catching a genuinely unreachable database.
      () => this.prismaIndicator.pingCheck('database', this.prisma, { timeout: 5000 }),
    ]);
  }
}
