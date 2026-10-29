import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthResponseDto } from './dto/health-response.dto';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

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
