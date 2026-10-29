import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Event as PrismaEvent,
  EventStatus,
  Prisma,
  Role,
  TicketStatus,
  User as PrismaUser,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AttendeeResponseDto } from './dto/attendee-response.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { EventResponseDto } from './dto/event-response.dto';
import { PaginatedEventsDto } from './dto/paginated-events.dto';
import { EventSortOrder, QueryEventsDto } from './dto/query-events.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { generateUniqueSlug } from './utils/slug.util';

type EventWithOrganizer = PrismaEvent & {
  organizer?: Pick<PrismaUser, 'id' | 'email' | 'name' | 'role' | 'createdAt'>;
};

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    organizerId: string,
    dto: CreateEventDto,
  ): Promise<EventResponseDto> {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be after startsAt');
    }

    const slug = await generateUniqueSlug(this.prisma, dto.title);

    const event = await this.prisma.event.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        location: dto.location,
        startsAt,
        endsAt,
        capacity: dto.capacity,
        coverImageUrl: dto.coverImageUrl,
        status: dto.status ?? EventStatus.DRAFT,
        organizerId,
      },
      include: {
        organizer: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    return this.mapToEventResponse(event);
  }

  async findAll(query: QueryEventsDto): Promise<PaginatedEventsDto> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 10;
    const skip = (page - 1) * pageSize;

    const where: Prisma.EventWhereInput = {
      status: EventStatus.PUBLISHED,
    };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.from || query.to) {
      where.startsAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    const sortOrder = query.sort === EventSortOrder.DESC ? 'desc' : 'asc';

    const [total, events] = await this.prisma.$transaction([
      this.prisma.event.count({ where }),
      this.prisma.event.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { startsAt: sortOrder },
        include: {
          organizer: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              tickets: {
                where: { status: TicketStatus.VALID },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize) || 1;

    return {
      items: events.map((e) => this.mapToEventResponse(e, e._count?.tickets)),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async findBySlug(
    slug: string,
    requestingUser?: { id: string; role: Role },
  ): Promise<EventResponseDto> {
    const event = await this.prisma.event.findUnique({
      where: { slug },
      include: {
        organizer: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            tickets: {
              where: { status: TicketStatus.VALID },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Only owner and admin can view non-published (DRAFT / CANCELLED) events
    if (event.status !== EventStatus.PUBLISHED) {
      const isOwner = requestingUser && requestingUser.id === event.organizerId;
      const isAdmin = requestingUser && requestingUser.role === Role.ADMIN;
      if (!isOwner && !isAdmin) {
        throw new NotFoundException('Event not found');
      }
    }

    return this.mapToEventResponse(event, event._count?.tickets);
  }

  async update(
    id: string,
    userId: string,
    userRole: Role,
    dto: UpdateEventDto,
  ): Promise<EventResponseDto> {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Ownership check: only owner (or admin) can update
    if (event.organizerId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException('You can only update your own events');
    }

    // Validate date ordering if either date changes
    const startsAt = dto.startsAt ? new Date(dto.startsAt) : event.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : event.endsAt;

    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be after startsAt');
    }

    // Capacity validation: cannot reduce capacity below issued valid tickets
    if (dto.capacity !== undefined) {
      const validTicketsCount = await this.prisma.ticket.count({
        where: { eventId: id, status: TicketStatus.VALID },
      });

      if (dto.capacity < validTicketsCount) {
        throw new BadRequestException(
          `Capacity cannot be reduced below current confirmed ticket count (${validTicketsCount})`,
        );
      }
    }

    // Update slug if title is changing
    let newSlug = event.slug;
    if (dto.title && dto.title !== event.title) {
      newSlug = await generateUniqueSlug(this.prisma, dto.title, id);
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data: {
        ...(dto.title ? { title: dto.title, slug: newSlug } : {}),
        ...(dto.description ? { description: dto.description } : {}),
        ...(dto.location ? { location: dto.location } : {}),
        ...(dto.startsAt ? { startsAt } : {}),
        ...(dto.endsAt ? { endsAt } : {}),
        ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
        ...(dto.coverImageUrl !== undefined
          ? { coverImageUrl: dto.coverImageUrl }
          : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
      include: {
        organizer: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            tickets: {
              where: { status: TicketStatus.VALID },
            },
          },
        },
      },
    });

    return this.mapToEventResponse(updated, updated._count?.tickets);
  }

  async softCancel(
    id: string,
    userId: string,
    userRole: Role,
  ): Promise<EventResponseDto> {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Ownership check: owner or admin can soft-cancel
    if (event.organizerId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to cancel this event',
      );
    }

    const cancelled = await this.prisma.event.update({
      where: { id },
      data: {
        status: EventStatus.CANCELLED,
      },
      include: {
        organizer: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    return this.mapToEventResponse(cancelled);
  }

  async getAttendees(
    id: string,
    userId: string,
    userRole: Role,
  ): Promise<AttendeeResponseDto[]> {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Ownership check: owner only (or admin)
    if (event.organizerId !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only the event organizer can view attendees',
      );
    }

    const tickets = await this.prisma.ticket.findMany({
      where: { eventId: id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tickets.map((t) => ({
      ticketId: t.id,
      code: t.code,
      status: t.status,
      checkedInAt: t.checkedInAt,
      createdAt: t.createdAt,
      user: t.user,
    }));
  }

  private mapToEventResponse(
    event: EventWithOrganizer,
    ticketsCount?: number,
  ): EventResponseDto {
    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      description: event.description,
      location: event.location,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      capacity: event.capacity,
      coverImageUrl: event.coverImageUrl,
      status: event.status,
      organizerId: event.organizerId,
      organizer: event.organizer,
      ticketsCount,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }
}
