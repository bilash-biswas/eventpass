import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok', description: 'API health status' })
  status!: string;

  @ApiProperty({
    example: 'healthy',
    description: 'Database connection status',
  })
  database!: string;

  @ApiProperty({
    example: '2026-10-29T01:00:00.000Z',
    description: 'Current server UTC timestamp',
  })
  timestamp!: string;
}
