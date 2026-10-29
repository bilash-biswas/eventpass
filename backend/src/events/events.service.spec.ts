import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EventStatus, Role, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from './events.service';

describe('EventsService', () => {
  let service: EventsService;
  let prisma: PrismaService;

  const mockOrganizer = {
    id: 'org-uuid-1',
    email: 'organizer@example.com',
    name: 'Organizer User',
    role: Role.ORGANIZER,
    createdAt: new Date(),
  };

  const mockEvent = {
    id: 'event-uuid-1',
    slug: 'tech-summit-2026',
    title: 'Tech Summit 2026',
    description: 'A great tech conference with inspiring speakers.',
    location: 'San Francisco, CA',
    startsAt: new Date('2026-11-15T09:00:00.000Z'),
    endsAt: new Date('2026-11-15T18:00:00.000Z'),
    capacity: 100,
    coverImageUrl: null,
    status: EventStatus.PUBLISHED,
    organizerId: mockOrganizer.id,
    organizer: mockOrganizer,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { tickets: 10 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: {
            event: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            ticket: {
              count: jest.fn(),
              findMany: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should throw BadRequestException if endsAt is before or equal to startsAt', async () => {
      await expect(
        service.create(mockOrganizer.id, {
          title: 'Invalid Dates Event',
          description: 'Event with bad date range.',
          location: 'Virtual',
          startsAt: '2026-11-15T18:00:00.000Z',
          endsAt: '2026-11-15T09:00:00.000Z',
          capacity: 50,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should generate a unique slug and create event', async () => {
      // Slug collision check: mock findMany returning existing slug 'tech-summit'
      jest
        .spyOn(prisma.event, 'findMany')
        .mockResolvedValueOnce([{ slug: 'tech-summit' }] as never);

      jest.spyOn(prisma.event, 'create').mockResolvedValueOnce({
        ...mockEvent,
        slug: 'tech-summit-1',
      });

      const result = await service.create(mockOrganizer.id, {
        title: 'Tech Summit',
        description: 'A great tech conference with inspiring speakers.',
        location: 'San Francisco, CA',
        startsAt: '2026-11-15T09:00:00.000Z',
        endsAt: '2026-11-15T18:00:00.000Z',
        capacity: 100,
      });

      expect(result.slug).toBe('tech-summit-1');
      expect(prisma.event.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated published events', async () => {
      jest
        .spyOn(prisma, '$transaction')
        .mockResolvedValueOnce([1, [mockEvent]] as never);

      const result = await service.findAll({ page: 1, pageSize: 10 });
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(mockEvent.id);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('findBySlug', () => {
    it('should return published event for public users', async () => {
      jest.spyOn(prisma.event, 'findUnique').mockResolvedValueOnce(mockEvent);

      const result = await service.findBySlug(mockEvent.slug);
      expect(result.id).toBe(mockEvent.id);
    });

    it('should throw NotFoundException if event does not exist', async () => {
      jest.spyOn(prisma.event, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.findBySlug('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if event is DRAFT and user is not owner/admin', async () => {
      jest.spyOn(prisma.event, 'findUnique').mockResolvedValueOnce({
        ...mockEvent,
        status: EventStatus.DRAFT,
      });

      await expect(
        service.findBySlug(mockEvent.slug, {
          id: 'other-user',
          role: Role.USER,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow owner to view DRAFT event by slug', async () => {
      jest.spyOn(prisma.event, 'findUnique').mockResolvedValueOnce({
        ...mockEvent,
        status: EventStatus.DRAFT,
      });

      const result = await service.findBySlug(mockEvent.slug, {
        id: mockOrganizer.id,
        role: Role.ORGANIZER,
      });
      expect(result.id).toBe(mockEvent.id);
    });
  });

  describe('update', () => {
    it('should throw ForbiddenException if user is not the owner or admin', async () => {
      jest.spyOn(prisma.event, 'findUnique').mockResolvedValueOnce(mockEvent);

      await expect(
        service.update(mockEvent.id, 'intruder-id', Role.USER, {
          title: 'Hacked Title',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if capacity is reduced below confirmed tickets', async () => {
      jest.spyOn(prisma.event, 'findUnique').mockResolvedValueOnce(mockEvent);
      jest.spyOn(prisma.ticket, 'count').mockResolvedValueOnce(50);

      await expect(
        service.update(mockEvent.id, mockOrganizer.id, Role.ORGANIZER, {
          capacity: 40,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update event when authorized', async () => {
      jest.spyOn(prisma.event, 'findUnique').mockResolvedValueOnce(mockEvent);
      jest.spyOn(prisma.event, 'findMany').mockResolvedValueOnce([] as never);
      jest.spyOn(prisma.event, 'update').mockResolvedValueOnce({
        ...mockEvent,
        title: 'Updated Tech Summit',
      });

      const result = await service.update(
        mockEvent.id,
        mockOrganizer.id,
        Role.ORGANIZER,
        { title: 'Updated Tech Summit' },
      );

      expect(result.title).toBe('Updated Tech Summit');
    });
  });

  describe('softCancel', () => {
    it('should throw ForbiddenException if user is not owner or admin', async () => {
      jest.spyOn(prisma.event, 'findUnique').mockResolvedValueOnce(mockEvent);

      await expect(
        service.softCancel(mockEvent.id, 'random-user', Role.USER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should set status to CANCELLED for owner', async () => {
      jest.spyOn(prisma.event, 'findUnique').mockResolvedValueOnce(mockEvent);
      jest.spyOn(prisma.event, 'update').mockResolvedValueOnce({
        ...mockEvent,
        status: EventStatus.CANCELLED,
      });

      const result = await service.softCancel(
        mockEvent.id,
        mockOrganizer.id,
        Role.ORGANIZER,
      );
      expect(result.status).toBe(EventStatus.CANCELLED);
    });
  });

  describe('getAttendees', () => {
    it('should return attendee tickets for owner', async () => {
      jest.spyOn(prisma.event, 'findUnique').mockResolvedValueOnce(mockEvent);
      jest.spyOn(prisma.ticket, 'findMany').mockResolvedValueOnce([
        {
          id: 'ticket-1',
          code: 'EP-CODE-123',
          status: TicketStatus.VALID,
          checkedInAt: null,
          createdAt: new Date(),
          user: mockOrganizer,
        },
      ] as never);

      const result = await service.getAttendees(
        mockEvent.id,
        mockOrganizer.id,
        Role.ORGANIZER,
      );
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('EP-CODE-123');
    });
  });
});
