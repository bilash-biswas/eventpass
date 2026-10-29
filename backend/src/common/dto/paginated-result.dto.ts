import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResultDto<T> {
  items!: T[];

  @ApiProperty({
    example: 42,
    description: 'Total number of items matching filter',
  })
  total!: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page!: number;

  @ApiProperty({ example: 10, description: 'Number of items per page' })
  pageSize!: number;

  @ApiProperty({ example: 5, description: 'Total number of available pages' })
  totalPages!: number;
}
