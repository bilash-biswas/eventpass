import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateEventDto {
  @ApiProperty({
    example: 'Global Tech Summit 2026',
    description: 'Title of the event',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(255, { message: 'Title cannot exceed 255 characters' })
  title!: string;

  @ApiProperty({
    example:
      'Join premier industry leaders and developers for an immersive conference on modern cloud and distributed architectures.',
    description: 'Detailed description of the event',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Description must be at least 10 characters long' })
  description!: string;

  @ApiProperty({
    example: 'San Francisco Convention Center, CA',
    description: 'Physical or virtual venue location',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Location must be at least 3 characters long' })
  location!: string;

  @ApiProperty({
    example: '2026-11-15T09:00:00.000Z',
    description: 'Event start time in ISO 8601 UTC format',
  })
  @IsISO8601({}, { message: 'startsAt must be a valid ISO 8601 date string' })
  @IsNotEmpty()
  startsAt!: string;

  @ApiProperty({
    example: '2026-11-15T18:00:00.000Z',
    description: 'Event end time in ISO 8601 UTC format',
  })
  @IsISO8601({}, { message: 'endsAt must be a valid ISO 8601 date string' })
  @IsNotEmpty()
  endsAt!: string;

  @ApiProperty({
    example: 250,
    description: 'Maximum attendee capacity',
    minimum: 1,
  })
  @IsInt({ message: 'Capacity must be an integer' })
  @Min(1, { message: 'Capacity must be at least 1' })
  capacity!: number;

  @ApiPropertyOptional({
    example: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
    description: 'Public URL to the cover banner image',
  })
  @IsOptional()
  @IsUrl({}, { message: 'coverImageUrl must be a valid URL' })
  coverImageUrl?: string;

  @ApiPropertyOptional({
    enum: EventStatus,
    default: EventStatus.DRAFT,
    description: 'Initial publication status of the event',
  })
  @IsOptional()
  @IsEnum(EventStatus, {
    message: 'Status must be DRAFT, PUBLISHED, or CANCELLED',
  })
  status?: EventStatus;
}
