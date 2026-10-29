import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateEventDto {
  @ApiPropertyOptional({
    example: 'Global Tech Summit 2026 - Extended Edition',
    description: 'Updated event title',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(255, { message: 'Title cannot exceed 255 characters' })
  title?: string;

  @ApiPropertyOptional({
    example: 'Updated comprehensive event description.',
    description: 'Updated event description',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters long' })
  description?: string;

  @ApiPropertyOptional({
    example: 'Moscone Center, San Francisco, CA',
    description: 'Updated venue location',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(3, { message: 'Location must be at least 3 characters long' })
  location?: string;

  @ApiPropertyOptional({
    example: '2026-11-15T09:00:00.000Z',
    description: 'Updated event start time in ISO 8601 UTC format',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'startsAt must be a valid ISO 8601 date string' })
  startsAt?: string;

  @ApiPropertyOptional({
    example: '2026-11-15T18:00:00.000Z',
    description: 'Updated event end time in ISO 8601 UTC format',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'endsAt must be a valid ISO 8601 date string' })
  endsAt?: string;

  @ApiPropertyOptional({
    example: 300,
    description:
      'Updated capacity (must not be lower than currently booked tickets)',
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Capacity must be an integer' })
  @Min(1, { message: 'Capacity must be at least 1' })
  capacity?: number;

  @ApiPropertyOptional({
    example: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
    description: 'Updated cover image URL',
  })
  @IsOptional()
  @IsUrl({}, { message: 'coverImageUrl must be a valid URL' })
  coverImageUrl?: string;

  @ApiPropertyOptional({
    enum: EventStatus,
    description:
      'Update status (e.g. set to PUBLISHED to make public, or CANCELLED)',
  })
  @IsOptional()
  @IsEnum(EventStatus, {
    message: 'Status must be DRAFT, PUBLISHED, or CANCELLED',
  })
  status?: EventStatus;
}
