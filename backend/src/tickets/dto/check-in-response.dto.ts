import { ApiProperty } from '@nestjs/swagger';
import { TicketResponseDto } from './ticket-response.dto';

export class CheckInResponseDto {
  @ApiProperty({
    example: 'Check-in successful',
    description: 'Status message of the check-in operation',
  })
  message!: string;

  @ApiProperty({
    type: TicketResponseDto,
    description: 'Updated ticket record after check-in',
  })
  ticket!: TicketResponseDto;
}
