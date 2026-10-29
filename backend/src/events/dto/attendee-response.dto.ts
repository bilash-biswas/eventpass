import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus } from '@prisma/client';
import { UserResponseDto } from '../../auth/dto/user-response.dto';

export class AttendeeResponseDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Ticket UUID',
  })
  ticketId!: string;

  @ApiProperty({
    example: 'EP-9f8e7d6c5b4a3210fedcba9876543210',
    description: 'Unique ticket QR code string',
  })
  code!: string;

  @ApiProperty({
    enum: TicketStatus,
    example: TicketStatus.VALID,
    description: 'Ticket status',
  })
  status!: TicketStatus;

  @ApiPropertyOptional({
    example: '2026-11-15T09:30:00.000Z',
    description: 'Timestamp when ticket was checked in, or null',
    nullable: true,
  })
  checkedInAt!: Date | null;

  @ApiProperty({
    example: '2026-10-29T01:00:00.000Z',
    description: 'RSVP timestamp',
  })
  createdAt!: Date;

  @ApiProperty({
    type: UserResponseDto,
    description: 'Attendee user details',
  })
  user!: UserResponseDto;
}
