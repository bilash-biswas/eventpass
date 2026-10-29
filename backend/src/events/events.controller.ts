import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
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
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AttendeeResponseDto } from './dto/attendee-response.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { EventResponseDto } from './dto/event-response.dto';
import { PaginatedEventsDto } from './dto/paginated-events.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Public listing of published events with search and filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of published events.',
    type: PaginatedEventsDto,
  })
  async findAll(@Query() query: QueryEventsDto): Promise<PaginatedEventsDto> {
    return this.eventsService.findAll(query);
  }

  @Public()
  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Public event detail lookup by unique slug' })
  @ApiParam({ name: 'slug', description: 'Unique event slug' })
  @ApiResponse({
    status: 200,
    description: 'Event details retrieved successfully.',
    type: EventResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found or not published.',
  })
  async findBySlug(
    @Param('slug') slug: string,
    @CurrentUser() user?: CurrentUserType,
  ): Promise<EventResponseDto> {
    return this.eventsService.findBySlug(slug, user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new event (ORGANIZER or ADMIN)' })
  @ApiResponse({
    status: 201,
    description: 'Event successfully created.',
    type: EventResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or startsAt >= endsAt.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Requires ORGANIZER or ADMIN role.',
  })
  async create(
    @CurrentUser('id') organizerId: string,
    @Body() dto: CreateEventDto,
  ): Promise<EventResponseDto> {
    return this.eventsService.create(organizerId, dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update event details or publish (owner only)' })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiResponse({
    status: 200,
    description: 'Event updated successfully.',
    type: EventResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: You can only update your own events.',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found.',
  })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
    @Body() dto: UpdateEventDto,
  ): Promise<EventResponseDto> {
    return this.eventsService.update(id, user.id, user.role, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Soft-cancel an event (sets status to CANCELLED, owner or ADMIN)',
  })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiResponse({
    status: 200,
    description: 'Event successfully cancelled.',
    type: EventResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: You do not have permission to cancel this event.',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found.',
  })
  async softCancel(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ): Promise<EventResponseDto> {
    return this.eventsService.softCancel(id, user.id, user.role);
  }

  @Get(':id/attendees')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get attendee list for an event (owner only)' })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiResponse({
    status: 200,
    description: 'List of attendees and tickets.',
    type: [AttendeeResponseDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Only the event organizer can view attendees.',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found.',
  })
  async getAttendees(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ): Promise<AttendeeResponseDto[]> {
    return this.eventsService.getAttendees(id, user.id, user.role);
  }
}
