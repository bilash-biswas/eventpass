import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserType } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CheckInResponseDto } from './dto/check-in-response.dto';
import { CheckInDto } from './dto/check-in.dto';
import { TicketResponseDto } from './dto/ticket-response.dto';
import { TicketsService } from './tickets.service';

@ApiTags('Tickets')
@ApiBearerAuth('JWT-auth')
@Controller()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('events/:id/rsvp')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'RSVP for an event and receive an entry ticket with QR code',
  })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiResponse({
    status: 201,
    description: 'RSVP successful; ticket issued.',
    type: TicketResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Event is unpublished, cancelled, or has ended.',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found.',
  })
  @ApiResponse({
    status: 409,
    description: "Conflict: User already RSVP'd or event is at full capacity.",
  })
  async rsvp(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ): Promise<TicketResponseDto> {
    return this.ticketsService.rsvp(eventId, userId);
  }

  @Delete('events/:id/rsvp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel own RSVP and release event spot' })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiResponse({
    status: 200,
    description: 'RSVP successfully cancelled.',
  })
  @ApiResponse({
    status: 400,
    description: 'Ticket is already cancelled or already checked in.',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found.',
  })
  async cancelRsvp(
    @Param('id') eventId: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ message: string }> {
    return this.ticketsService.cancelRsvp(eventId, userId);
  }

  @Get('tickets/me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all tickets belonging to the current user' })
  @ApiResponse({
    status: 200,
    description: 'List of own tickets with event details.',
    type: [TicketResponseDto],
  })
  async getMyTickets(
    @CurrentUser('id') userId: string,
  ): Promise<TicketResponseDto[]> {
    return this.ticketsService.getMyTickets(userId);
  }

  @Post('tickets/check-in')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @ApiOperation({
    summary:
      'Atomic attendee check-in using QR code (event owner or ADMIN only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Check-in successful.',
    type: CheckInResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ticket is cancelled.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: You are not authorized for this event.',
  })
  @ApiResponse({
    status: 404,
    description: 'Invalid ticket code.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict: Ticket has already been checked in.',
  })
  async checkIn(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CheckInDto,
  ): Promise<CheckInResponseDto> {
    return this.ticketsService.checkIn(user.id, user.role, dto);
  }
}
