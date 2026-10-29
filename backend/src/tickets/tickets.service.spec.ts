import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsService } from './tickets.service';

describe('TicketsService', () => {
  let service: TicketsService;
  let prisma: PrismaService;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'user@example.com',
    name: 'Test Attendee',
    role: Role.USER,
    createdAt: new Date(),
  };

  const mockOrganizer = {
    id: 'org-uuid-1',
    email: 'organizer@example.com',
    name: 'Event Organizer',
    role: Role.ORGANIZER,
    createdAt: new Date(),
  };

  const mockEvent = {
    id: 'event-uuid-1',
    slug: 'live-conference-2026',
    title: 'Live Conference 2026',
    description: 'Conference description.',
    location: 'Conference Hall A',
    startsAt: new Date(Date.now() + 86400000), // tomorrow
    endsAt: new Date(Date.now() + 172800000), // day after tomorrow
    capacity: 2,
    coverImageUrl: null,
    status: 'PUBLISHED',
    organizerId: mockOrganizer.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTicket = {
    id: 'ticket-uuid-1',
    code: 'TKT_1234567890abcdef1234567890abcdef',
    status: TicketStatus.VALID,
    eventId: mockEvent.id,
    userId: mockUser.id,
    checkedInAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    event: mockEvent,
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: PrismaService,
          useValue: {
            ticket: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              count: jest.fn(),
            },
            $queryRaw: jest.fn(),
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('rsvp', () => {
    it('should throw ConflictException if event is at full capacity', async () => {
      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(
          async (callback: (tx: unknown) => Promise<unknown>) => {
            const tx = {
              $queryRaw: jest.fn().mockResolvedValueOnce([mockEvent]),
              ticket: {
                findUnique: jest.fn().mockResolvedValueOnce(null),
                count: jest.fn().mockResolvedValueOnce(2), // equal to capacity 2
              },
            };
            return await callback(tx);
          },
        );

      await expect(service.rsvp(mockEvent.id, mockUser.id)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should successfully issue a ticket with random code when capacity is available', async () => {
      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(
          async (callback: (tx: unknown) => Promise<unknown>) => {
            const tx = {
              $queryRaw: jest.fn().mockResolvedValueOnce([mockEvent]),
              ticket: {
                findUnique: jest.fn().mockResolvedValueOnce(null),
                count: jest.fn().mockResolvedValueOnce(1), // 1 < capacity 2
                create: jest.fn().mockResolvedValueOnce(mockTicket),
              },
            };
            return await callback(tx);
          },
        );

      const result = await service.rsvp(mockEvent.id, mockUser.id);
      expect(result.id).toBe(mockTicket.id);
      expect(result.code).toBe(mockTicket.code);
      expect(result.code.startsWith('TKT_')).toBe(true);
    });
  });

  describe('cancelRsvp', () => {
    it('should throw NotFoundException if user has no ticket', async () => {
      jest.spyOn(prisma.ticket, 'findUnique').mockResolvedValueOnce(null);

      await expect(
        service.cancelRsvp(mockEvent.id, mockUser.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if ticket already cancelled', async () => {
      jest.spyOn(prisma.ticket, 'findUnique').mockResolvedValueOnce({
        ...mockTicket,
        status: TicketStatus.CANCELLED,
      });

      await expect(
        service.cancelRsvp(mockEvent.id, mockUser.id),
      ).rejects.toThrow('Ticket is already cancelled');
    });

    it('should throw BadRequestException if ticket already checked in', async () => {
      jest.spyOn(prisma.ticket, 'findUnique').mockResolvedValueOnce({
        ...mockTicket,
        status: TicketStatus.CHECKED_IN,
      });

      await expect(
        service.cancelRsvp(mockEvent.id, mockUser.id),
      ).rejects.toThrow(
        'Cannot cancel a ticket that has already been checked in',
      );
    });

    it('should cancel RSVP successfully', async () => {
      jest.spyOn(prisma.ticket, 'findUnique').mockResolvedValueOnce(mockTicket);
      jest.spyOn(prisma.ticket, 'update').mockResolvedValueOnce({
        ...mockTicket,
        status: TicketStatus.CANCELLED,
      });

      const result = await service.cancelRsvp(mockEvent.id, mockUser.id);
      expect(result.message).toBe('RSVP successfully cancelled');
    });
  });

  describe('checkIn (atomic check-in & distinct errors)', () => {
    const code = mockTicket.code;

    it('should return distinct error for invalid code (404)', async () => {
      jest.spyOn(prisma.ticket, 'findUnique').mockResolvedValueOnce(null);

      await expect(
        service.checkIn(mockOrganizer.id, Role.ORGANIZER, { code }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return distinct error for wrong event (403)', async () => {
      jest.spyOn(prisma.ticket, 'findUnique').mockResolvedValueOnce(mockTicket);

      await expect(
        service.checkIn('other-organizer-id', Role.ORGANIZER, { code }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return distinct error for ticket cancelled (400)', async () => {
      jest.spyOn(prisma.ticket, 'findUnique').mockResolvedValueOnce({
        ...mockTicket,
        status: TicketStatus.CANCELLED,
      });

      await expect(
        service.checkIn(mockOrganizer.id, Role.ORGANIZER, { code }),
      ).rejects.toThrow('This ticket has been cancelled');
    });

    it('should return distinct error for already checked in (409)', async () => {
      jest.spyOn(prisma.ticket, 'findUnique').mockResolvedValueOnce({
        ...mockTicket,
        status: TicketStatus.CHECKED_IN,
      });

      await expect(
        service.checkIn(mockOrganizer.id, Role.ORGANIZER, { code }),
      ).rejects.toThrow('This ticket has already been checked in');
    });

    it('should atomically check in ticket and return success', async () => {
      jest.spyOn(prisma.ticket, 'findUnique').mockResolvedValueOnce(mockTicket);
      jest
        .spyOn(prisma.ticket, 'updateMany')
        .mockResolvedValueOnce({ count: 1 });

      const result = await service.checkIn(mockOrganizer.id, Role.ORGANIZER, {
        code,
      });

      expect(result.message).toBe('Check-in successful');
      expect(result.ticket.status).toBe(TicketStatus.CHECKED_IN);
      expect(result.ticket.checkedInAt).toBeDefined();
    });

    it('should detect race condition if updateMany affected count is 0', async () => {
      jest.spyOn(prisma.ticket, 'findUnique').mockResolvedValueOnce(mockTicket);
      jest
        .spyOn(prisma.ticket, 'updateMany')
        .mockResolvedValueOnce({ count: 0 });

      await expect(
        service.checkIn(mockOrganizer.id, Role.ORGANIZER, { code }),
      ).rejects.toThrow('This ticket has already been checked in');
    });
  });
});
