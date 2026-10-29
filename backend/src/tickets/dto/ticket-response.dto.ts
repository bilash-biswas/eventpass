import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus } from '@prisma/client';
import { UserResponseDto } from '../../auth/dto/user-response.dto';
import { EventResponseDto } from '../../events/dto/event-response.dto';

export class TicketResponseDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Unique ticket identifier (UUID)',
  })
  id!: string;

  @ApiProperty({
    example: 'TKT_9f8e7d6c5b4a3210fedcba9876543210',
    description: 'Cryptographically random string encoded in the QR code',
  })
  code!: string;

  @ApiProperty({
    enum: TicketStatus,
    example: TicketStatus.VALID,
    description: 'Ticket status (VALID, CHECKED_IN, CANCELLED)',
  })
  status!: TicketStatus;

  @ApiProperty({
    example: 'c6b3e21a-4d5e-4f12-9876-0a1b2c3d4e5f',
    description: 'Associated event UUID',
  })
  eventId!: string;

  @ApiProperty({
    example: 'd9b2d63d-a233-4123-8478-f7b8f9e61234',
    description: 'Ticket owner user UUID',
  })
  userId!: string;

  @ApiPropertyOptional({
    example: '2026-11-15T09:30:00.000Z',
    description: 'Timestamp when ticket was checked in, or null',
    nullable: true,
  })
  checkedInAt!: Date | null;

  @ApiProperty({
    example: '2026-10-29T01:00:00.000Z',
    description: 'Ticket issuance timestamp',
  })
  createdAt!: Date;

  @ApiPropertyOptional({
    type: () => EventResponseDto,
    description: 'Details of the associated event',
  })
  event?: EventResponseDto;

  @ApiPropertyOptional({
    type: () => UserResponseDto,
    description: 'Details of the ticket owner',
  })
  user?: UserResponseDto;
}
