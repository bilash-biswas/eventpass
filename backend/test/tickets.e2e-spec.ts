import { EventEmitter } from 'node:events';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Tickets & Concurrency (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let organizerToken: string;
  let otherOrganizerToken: string;

  // 10 concurrent test users
  const testUsers: Array<{ email: string; token: string; id: string }> = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1', {
      exclude: ['/docs', '/docs-json'],
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();
    (app.getHttpServer() as EventEmitter).setMaxListeners(30);
    prisma = app.get(PrismaService);

    // Register primary organizer
    const orgRes = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: 'tickets-e2e-org1@example.com',
        password: 'Password123!',
        name: 'Tickets Organizer 1',
        role: Role.ORGANIZER,
      });
    organizerToken = orgRes.body.accessToken;

    // Register secondary organizer
    const otherOrgRes = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: 'tickets-e2e-org2@example.com',
        password: 'Password123!',
        name: 'Tickets Organizer 2',
        role: Role.ORGANIZER,
      });
    otherOrganizerToken = otherOrgRes.body.accessToken;

    // Register 10 distinct users for concurrency testing
    for (let i = 1; i <= 10; i++) {
      const regRes = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: `tickets-e2e-user${i}@example.com`,
          password: 'Password123!',
          name: `Concurrent User ${i}`,
          role: Role.USER,
        });
      testUsers.push({
        email: `tickets-e2e-user${i}@example.com`,
        token: regRes.body.accessToken,
        id: regRes.body.user.id,
      });
    }
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'tickets-e2e',
        },
      },
    });
    await app.close();
  });

  describe('Concurrency Test: 10 simultaneous RSVPs for 1 spot', () => {
    let limitedEventId: string;

    beforeAll(async () => {
      // Create an event with capacity = 1
      const res = await request(app.getHttpServer())
        .post('/v1/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'High Demand Limited Event',
          description: 'Only 1 single spot available in the entire event.',
          location: 'Exclusive Lounge',
          startsAt: new Date(Date.now() + 86400000).toISOString(),
          endsAt: new Date(Date.now() + 172800000).toISOString(),
          capacity: 1,
          status: 'PUBLISHED',
        });
      limitedEventId = res.body.id;
    });

    it('asserts exactly ONE RSVP succeeds and NINE receive 409 Conflict', async () => {
      // Fire 10 concurrent HTTP requests simultaneously
      const responses = await Promise.all(
        testUsers.map((user) =>
          request(app.getHttpServer())
            .post(`/v1/events/${limitedEventId}/rsvp`)
            .set('Authorization', `Bearer ${user.token}`)
            .send(),
        ),
      );

      const successful = responses.filter((r) => r.status === 201);
      const conflicts = responses.filter((r) => r.status === 409);

      // Critical assertion: exactly one won the spot
      expect(successful).toHaveLength(1);
      expect(conflicts).toHaveLength(9);

      // Verify the issued ticket has a random code without internal IDs
      const winningTicket = successful[0].body as {
        code: string;
        userId: string;
      };
      expect(winningTicket.code).toBeDefined();
      expect(winningTicket.code.startsWith('TKT_')).toBe(true);
      expect(winningTicket.code).not.toContain(limitedEventId);
      expect(winningTicket.code).not.toContain(winningTicket.userId);

      // Database verification
      const ticketCountInDb = await prisma.ticket.count({
        where: { eventId: limitedEventId },
      });
      expect(ticketCountInDb).toBe(1);
    });

    it('should reject a duplicate RSVP from the winning user with 409', async () => {
      // Find who got the ticket
      const existingTicket = await prisma.ticket.findFirst({
        where: { eventId: limitedEventId },
      });
      const winningUser = testUsers.find(
        (u) => u.id === existingTicket?.userId,
      );
      expect(winningUser).toBeDefined();

      const response = await request(app.getHttpServer())
        .post(`/v1/events/${limitedEventId}/rsvp`)
        .set('Authorization', `Bearer ${winningUser!.token}`)
        .send()
        .expect(409);

      expect(response.body.message).toContain('already RSVP');
    });

    it('should allow ticket owner to cancel RSVP and release the spot', async () => {
      const existingTicket = await prisma.ticket.findFirst({
        where: { eventId: limitedEventId },
      });
      const winningUser = testUsers.find(
        (u) => u.id === existingTicket?.userId,
      );

      await request(app.getHttpServer())
        .delete(`/v1/events/${limitedEventId}/rsvp`)
        .set('Authorization', `Bearer ${winningUser!.token}`)
        .expect(200);

      // Now another user can claim the newly released spot
      const otherUser = testUsers.find((u) => u.id !== winningUser?.id)!;
      const res = await request(app.getHttpServer())
        .post(`/v1/events/${limitedEventId}/rsvp`)
        .set('Authorization', `Bearer ${otherUser.token}`)
        .send()
        .expect(201);

      expect(res.body.userId).toBe(otherUser.id);
    });
  });

  describe('Atomic Check-In & Concurrent Double-Scan Test', () => {
    let checkInEventId: string;
    let ticketCode: string;

    beforeAll(async () => {
      // Create an event for check-in
      const eventRes = await request(app.getHttpServer())
        .post('/v1/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Check-In Verification Event',
          description: 'Testing atomic check-in logic.',
          location: 'Gate 4',
          startsAt: new Date(Date.now() + 86400000).toISOString(),
          endsAt: new Date(Date.now() + 172800000).toISOString(),
          capacity: 10,
          status: 'PUBLISHED',
        });
      checkInEventId = eventRes.body.id;

      // User 1 RSVPs
      const rsvpRes = await request(app.getHttpServer())
        .post(`/v1/events/${checkInEventId}/rsvp`)
        .set('Authorization', `Bearer ${testUsers[0].token}`)
        .send();

      ticketCode = rsvpRes.body.code;
    });

    it('asserts concurrent double-scan: exactly ONE returns 200 and the other 409', async () => {
      // Fire 2 simultaneous check-in scans for the exact same ticket code
      const [scan1, scan2] = await Promise.all([
        request(app.getHttpServer())
          .post('/v1/tickets/check-in')
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({ code: ticketCode }),
        request(app.getHttpServer())
          .post('/v1/tickets/check-in')
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({ code: ticketCode }),
      ]);

      const statuses = [scan1.status, scan2.status].sort();
      expect(statuses).toEqual([200, 409]);

      const successScan = scan1.status === 200 ? scan1 : scan2;
      const conflictScan = scan1.status === 409 ? scan1 : scan2;

      expect(successScan.body.message).toBe('Check-in successful');
      expect(successScan.body.ticket.status).toBe('CHECKED_IN');
      expect(successScan.body.ticket.checkedInAt).toBeDefined();

      expect(conflictScan.body.message).toBe(
        'This ticket has already been checked in',
      );
    });

    it('should return distinct error for invalid code (404)', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/tickets/check-in')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ code: 'TKT_completely_nonexistent_code' })
        .expect(404);

      expect(response.body.message).toBe('Invalid ticket code');
    });

    it('should return distinct error for wrong event (403)', async () => {
      // Create a ticket for Organizer 1, but Organizer 2 tries to scan it
      const rsvpRes = await request(app.getHttpServer())
        .post(`/v1/events/${checkInEventId}/rsvp`)
        .set('Authorization', `Bearer ${testUsers[1].token}`)
        .send();

      const response = await request(app.getHttpServer())
        .post('/v1/tickets/check-in')
        .set('Authorization', `Bearer ${otherOrganizerToken}`)
        .send({ code: rsvpRes.body.code })
        .expect(403);

      expect(response.body.message).toContain(
        'not authorized to check in tickets for this event',
      );
    });

    it('should return distinct error for cancelled ticket (400)', async () => {
      // User 2 RSVPs then cancels
      const rsvpRes = await request(app.getHttpServer())
        .post(`/v1/events/${checkInEventId}/rsvp`)
        .set('Authorization', `Bearer ${testUsers[2].token}`)
        .send();

      await request(app.getHttpServer())
        .delete(`/v1/events/${checkInEventId}/rsvp`)
        .set('Authorization', `Bearer ${testUsers[2].token}`)
        .expect(200);

      // Organizer attempts to check in cancelled ticket
      const response = await request(app.getHttpServer())
        .post('/v1/tickets/check-in')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ code: rsvpRes.body.code })
        .expect(400);

      expect(response.body.message).toBe('This ticket has been cancelled');
    });
  });

  describe('GET /v1/tickets/me', () => {
    it('should return all tickets for authenticated user with event details', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/tickets/me')
        .set('Authorization', `Bearer ${testUsers[0].token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0]).toHaveProperty('code');
      expect(response.body[0]).toHaveProperty('event');
      expect(response.body[0].event).toHaveProperty('title');
    });
  });
});
