import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { HealthResponseDto } from './dto/health-response.dto';
import { HealthService } from './health.service';

@ApiTags('Health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check service and database health status' })
  @ApiResponse({
    status: 200,
    description: 'System is healthy and database is connected.',
    type: HealthResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Database connection failed.',
  })
  async check(): Promise<HealthResponseDto> {
    return this.healthService.check();
  }
}
