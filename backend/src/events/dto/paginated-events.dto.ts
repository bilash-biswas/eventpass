import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResultDto } from '../../common/dto/paginated-result.dto';
import { EventResponseDto } from './event-response.dto';

export class PaginatedEventsDto extends PaginatedResultDto<EventResponseDto> {
  @ApiProperty({
    type: () => [EventResponseDto],
    description: 'Array of event records',
  })
  declare items: EventResponseDto[];
}
