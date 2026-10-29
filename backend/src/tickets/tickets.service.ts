import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Event as PrismaEvent,
  Role,
  Ticket as PrismaTicket,
  TicketStatus,
  User as PrismaUser,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CheckInResponseDto } from './dto/check-in-response.dto';
import { CheckInDto } from './dto/check-in.dto';
import { TicketResponseDto } from './dto/ticket-response.dto';

type TicketWithDetails = PrismaTicket & {
  event?: PrismaEvent & {
    organizer?: Pick<
      PrismaUser,
      'id' | 'email' | 'name' | 'role' | 'createdAt'
    >;
  };
  user?: Pick<PrismaUser, 'id' | 'email' | 'name' | 'role' | 'createdAt'>;
};

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async rsvp(eventId: string, userId: string): Promise<TicketResponseDto> {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Lock event row for UPDATE to prevent concurrent overbooking
      const lockedEvents = await tx.$queryRaw<
        Array<{ id: string; capacity: number; status: string; endsAt: Date }>
      >`
        SELECT id, capacity, status, "endsAt"
        FROM events
        WHERE id = ${eventId}
        FOR UPDATE
      `;

      if (!lockedEvents || lockedEvents.length === 0) {
        throw new NotFoundException('Event not found');
      }

      const event = lockedEvents[0];

      if (event.status !== 'PUBLISHED') {
        throw new BadRequestException(
          'Cannot RSVP to an unpublished or cancelled event',
        );
      }

      if (new Date(event.endsAt) <= new Date()) {
        throw new BadRequestException(
          'Cannot RSVP to an event that has already ended',
        );
      }

      // Check existing ticket for this user
      const existingTicket = await tx.ticket.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
      });

      if (existingTicket && existingTicket.status !== TicketStatus.CANCELLED) {
        throw new ConflictException("You have already RSVP'd to this event");
      }

      // Count confirmed tickets (VALID and CHECKED_IN)
      const confirmedCount = await tx.ticket.count({
        where: {
          eventId,
          status: { in: [TicketStatus.VALID, TicketStatus.CHECKED_IN] },
        },
      });

      if (confirmedCount >= event.capacity) {
        throw new ConflictException('Event is at full capacity');
      }

      const code = this.generateTicketCode();

      let ticket;
      if (existingTicket && existingTicket.status === TicketStatus.CANCELLED) {
        ticket = await tx.ticket.update({
          where: { id: existingTicket.id },
          data: {
            code,
            status: TicketStatus.VALID,
            checkedInAt: null,
          },
          include: {
            event: {
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
            },
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
        });
      } else {
        ticket = await tx.ticket.create({
          data: {
            code,
            status: TicketStatus.VALID,
            eventId,
            userId,
          },
          include: {
            event: {
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
            },
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
        });
      }

      return this.mapToTicketResponse(ticket);
    });
  }

  async cancelRsvp(
    eventId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const ticket = await this.prisma.ticket.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('You do not have a ticket for this event');
    }

    if (ticket.status === TicketStatus.CANCELLED) {
      throw new BadRequestException('Ticket is already cancelled');
    }

    if (ticket.status === TicketStatus.CHECKED_IN) {
      throw new BadRequestException(
        'Cannot cancel a ticket that has already been checked in',
      );
    }

    await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: TicketStatus.CANCELLED },
    });

    return { message: 'RSVP successfully cancelled' };
  }

  async getMyTickets(userId: string): Promise<TicketResponseDto[]> {
    const tickets = await this.prisma.ticket.findMany({
      where: { userId },
      include: {
        event: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tickets.map((t) => this.mapToTicketResponse(t));
  }

  async checkIn(
    organizerId: string,
    organizerRole: Role,
    dto: CheckInDto,
  ): Promise<CheckInResponseDto> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { code: dto.code },
      include: {
        event: true,
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
    });

    // Distinct error 1: Invalid code
    if (!ticket) {
      throw new NotFoundException('Invalid ticket code');
    }

    // Distinct error 2: Wrong event
    if (
      ticket.event.organizerId !== organizerId &&
      organizerRole !== Role.ADMIN
    ) {
      throw new ForbiddenException(
        'You are not authorized to check in tickets for this event',
      );
    }

    // Distinct error 3: Ticket cancelled
    if (ticket.status === TicketStatus.CANCELLED) {
      throw new BadRequestException('This ticket has been cancelled');
    }

    // Distinct error 4: Already checked in
    if (ticket.status === TicketStatus.CHECKED_IN) {
      throw new ConflictException('This ticket has already been checked in');
    }

    // Atomic update using updateMany where status is VALID
    const now = new Date();
    const updateResult = await this.prisma.ticket.updateMany({
      where: {
        id: ticket.id,
        status: TicketStatus.VALID,
      },
      data: {
        status: TicketStatus.CHECKED_IN,
        checkedInAt: now,
      },
    });

    if (updateResult.count === 0) {
      // Concurrent scan won the race
      throw new ConflictException('This ticket has already been checked in');
    }

    const updatedTicket: TicketResponseDto = {
      ...this.mapToTicketResponse(ticket),
      status: TicketStatus.CHECKED_IN,
      checkedInAt: now,
    };

    return {
      message: 'Check-in successful',
      ticket: updatedTicket,
    };
  }

  private generateTicketCode(): string {
    // 160 bits of cryptographic entropy, URL-safe hex string
    return `TKT_${randomBytes(20).toString('hex')}`;
  }

  private mapToTicketResponse(ticket: TicketWithDetails): TicketResponseDto {
    return {
      id: ticket.id,
      code: ticket.code,
      status: ticket.status,
      eventId: ticket.eventId,
      userId: ticket.userId,
      checkedInAt: ticket.checkedInAt,
      createdAt: ticket.createdAt,
      event: ticket.event,
      user: ticket.user,
    };
  }
}
