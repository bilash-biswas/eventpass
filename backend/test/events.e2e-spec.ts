import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Events and Users (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let userToken: string;
  let organizerToken: string;
  let otherOrganizerToken: string;
  let organizerId: string;

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
    prisma = app.get(PrismaService);

    // Register a standard USER
    const userRes = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: 'e2e-events-user@example.com',
        password: 'Password123!',
        name: 'Regular User',
        role: Role.USER,
      });
    userToken = userRes.body.accessToken;

    // Register an ORGANIZER
    const orgRes = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: 'e2e-events-org1@example.com',
        password: 'Password123!',
        name: 'Main Organizer',
        role: Role.ORGANIZER,
      });
    organizerToken = orgRes.body.accessToken;
    organizerId = orgRes.body.user.id;

    // Register a second ORGANIZER
    const otherOrgRes = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email: 'e2e-events-org2@example.com',
        password: 'Password123!',
        name: 'Other Organizer',
        role: Role.ORGANIZER,
      });
    otherOrganizerToken = otherOrgRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'e2e-events',
        },
      },
    });
    await app.close();
  });

  describe('GET /v1/users/me', () => {
    it('should fail with 401 when unauthenticated', async () => {
      await request(app.getHttpServer()).get('/v1/users/me').expect(401);
    });

    it('should return profile for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.email).toBe('e2e-events-user@example.com');
      expect(response.body.name).toBe('Regular User');
      expect(response.body.role).toBe('USER');
    });
  });

  describe('POST /v1/events (role restriction & slug collision)', () => {
    let initialSlug: string;

    it('should reject unauthenticated request with 401', async () => {
      await request(app.getHttpServer())
        .post('/v1/events')
        .send({
          title: 'Unauthenticated Summit',
          description: 'Valid event description here.',
          location: 'Online',
          startsAt: '2026-11-20T10:00:00.000Z',
          endsAt: '2026-11-20T18:00:00.000Z',
          capacity: 100,
        })
        .expect(401);
    });

    it('should reject USER role with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .post('/v1/events')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'User Summit',
          description: 'Valid event description here.',
          location: 'Online',
          startsAt: '2026-11-20T10:00:00.000Z',
          endsAt: '2026-11-20T18:00:00.000Z',
          capacity: 100,
        })
        .expect(403);
    });

    it('should allow ORGANIZER to create event with auto-generated slug', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Dev Summit 2026',
          description: 'A developer summit exploring modern tech.',
          location: 'San Francisco, CA',
          startsAt: '2026-11-20T10:00:00.000Z',
          endsAt: '2026-11-20T18:00:00.000Z',
          capacity: 150,
          status: 'PUBLISHED',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.slug).toBe('dev-summit-2026');
      expect(response.body.organizerId).toBe(organizerId);

      createdEventId = response.body.id;
      initialSlug = response.body.slug;
    });

    it('should handle slug collisions cleanly by appending counter suffix', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Dev Summit 2026',
          description: 'A second conference with an identical title.',
          location: 'New York, NY',
          startsAt: '2026-12-01T10:00:00.000Z',
          endsAt: '2026-12-01T18:00:00.000Z',
          capacity: 100,
        })
        .expect(201);

      expect(response.body.slug).toBe('dev-summit-2026-1');
      expect(response.body.slug).not.toBe(initialSlug);
    });
  });

  describe('GET /v1/events (public listing, search, filters & pagination)', () => {
    it('should return paginated published events with correct structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/events?page=1&pageSize=10')
        .expect(200);

      expect(response.body).toMatchObject({
        page: 1,
        pageSize: 10,
      });
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(typeof response.body.total).toBe('number');
      expect(typeof response.body.totalPages).toBe('number');
    });

    it('should filter events by search term matching location or title', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/events?search=Francisco')
        .expect(200);

      expect(response.body.items.length).toBeGreaterThanOrEqual(1);
      expect(response.body.items[0].location).toContain('Francisco');
    });
  });

  describe('GET /v1/events/:slug', () => {
    it('should return published event details by slug', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/events/dev-summit-2026')
        .expect(200);

      expect(response.body.title).toBe('Dev Summit 2026');
      expect(response.body.organizer).toBeDefined();
    });

    it('should return 404 for nonexistent slug', async () => {
      await request(app.getHttpServer())
        .get('/v1/events/unknown-slug-xyz')
        .expect(404);
    });
  });

  describe('PATCH /v1/events/:id (owner only)', () => {
    let eventToUpdateId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Updateable Event',
          description: 'Original event description.',
          location: 'Austin, TX',
          startsAt: '2026-11-25T10:00:00.000Z',
          endsAt: '2026-11-25T18:00:00.000Z',
          capacity: 50,
          status: 'DRAFT',
        });
      eventToUpdateId = res.body.id;
    });

    it('should forbid other organizer from updating this event (403)', async () => {
      await request(app.getHttpServer())
        .patch(`/v1/events/${eventToUpdateId}`)
        .set('Authorization', `Bearer ${otherOrganizerToken}`)
        .send({ title: 'Hijacked Event' })
        .expect(403);
    });

    it('should allow owner to update details and publish', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/v1/events/${eventToUpdateId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Published Event New Title',
          status: 'PUBLISHED',
          capacity: 80,
        })
        .expect(200);

      expect(response.body.title).toBe('Published Event New Title');
      expect(response.body.status).toBe('PUBLISHED');
      expect(response.body.capacity).toBe(80);
    });
  });

  describe('DELETE /v1/events/:id (soft-cancel)', () => {
    let eventToCancelId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Event To Cancel',
          description: 'Description before cancellation.',
          location: 'Seattle, WA',
          startsAt: '2026-12-10T10:00:00.000Z',
          endsAt: '2026-12-10T18:00:00.000Z',
          capacity: 100,
        });
      eventToCancelId = res.body.id;
    });

    it('should forbid non-owner from cancelling event (403)', async () => {
      await request(app.getHttpServer())
        .delete(`/v1/events/${eventToCancelId}`)
        .set('Authorization', `Bearer ${otherOrganizerToken}`)
        .expect(403);
    });

    it('should allow owner to soft-cancel event (status -> CANCELLED)', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/v1/events/${eventToCancelId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.status).toBe('CANCELLED');
    });
  });

  describe('GET /v1/events/:id/attendees (owner only)', () => {
    let testEventId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Attendee Test Event',
          description: 'Description for attendee test.',
          location: 'Chicago, IL',
          startsAt: '2026-12-15T10:00:00.000Z',
          endsAt: '2026-12-15T18:00:00.000Z',
          capacity: 100,
          status: 'PUBLISHED',
        });
      testEventId = res.body.id;
    });

    it('should forbid non-owner from accessing attendee list (403)', async () => {
      await request(app.getHttpServer())
        .get(`/v1/events/${testEventId}/attendees`)
        .set('Authorization', `Bearer ${otherOrganizerToken}`)
        .expect(403);
    });

    it('should allow owner to view attendee list', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/events/${testEventId}/attendees`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
