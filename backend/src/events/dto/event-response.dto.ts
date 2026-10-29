import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '@prisma/client';
import { UserResponseDto } from '../../auth/dto/user-response.dto';

export class EventResponseDto {
  @ApiProperty({
    example: 'c6b3e21a-4d5e-4f12-9876-0a1b2c3d4e5f',
    description: 'Unique event identifier (UUID)',
  })
  id!: string;

  @ApiProperty({
    example: 'global-tech-summit-2026',
    description: 'Unique URL-friendly slug',
  })
  slug!: string;

  @ApiProperty({
    example: 'Global Tech Summit 2026',
    description: 'Event title',
  })
  title!: string;

  @ApiProperty({
    example: 'Detailed description of the event...',
    description: 'Full event description',
  })
  description!: string;

  @ApiProperty({
    example: 'San Francisco Convention Center, CA',
    description: 'Event location',
  })
  location!: string;

  @ApiProperty({
    example: '2026-11-15T09:00:00.000Z',
    description: 'Event start time',
  })
  startsAt!: Date;

  @ApiProperty({
    example: '2026-11-15T18:00:00.000Z',
    description: 'Event end time',
  })
  endsAt!: Date;

  @ApiProperty({
    example: 250,
    description: 'Maximum attendee capacity',
  })
  capacity!: number;

  @ApiPropertyOptional({
    example: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
    description: 'Cover image URL',
    nullable: true,
  })
  coverImageUrl!: string | null;

  @ApiProperty({
    enum: EventStatus,
    example: EventStatus.PUBLISHED,
    description: 'Event publication status',
  })
  status!: EventStatus;

  @ApiProperty({
    example: 'd9b2d63d-a233-4123-8478-f7b8f9e61234',
    description: 'Organizer user ID',
  })
  organizerId!: string;

  @ApiPropertyOptional({
    type: UserResponseDto,
    description: 'Organizer profile details',
  })
  organizer?: UserResponseDto;

  @ApiPropertyOptional({
    example: 45,
    description: 'Total number of confirmed RSVPs / tickets sold',
  })
  ticketsCount?: number;

  @ApiProperty({
    example: '2026-10-29T01:00:00.000Z',
    description: 'Record creation timestamp',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-10-29T01:00:00.000Z',
    description: 'Record last updated timestamp',
  })
  updatedAt!: Date;
}
