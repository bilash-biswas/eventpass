import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export enum EventSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class QueryEventsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search keyword matching title or location (case-insensitive)',
    example: 'Tech Summit',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter events starting on or after this ISO 8601 date',
    example: '2026-11-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    description: 'Filter events starting on or before this ISO 8601 date',
    example: '2026-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({
    enum: EventSortOrder,
    default: EventSortOrder.ASC,
    description: 'Sort direction by startsAt timestamp',
  })
  @IsOptional()
  @IsEnum(EventSortOrder)
  sort?: EventSortOrder = EventSortOrder.ASC;
}
