import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.refreshToken.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'e2e-auth',
        },
      },
    });
    await app.close();
  });

  describe('POST /v1/auth/register', () => {
    const testEmail = 'e2e-auth-reg@example.com';

    it('should register a new user and return tokens without passwordHash', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: testEmail,
          password: 'Password123!',
          name: 'E2E User',
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testEmail);
      expect(response.body.user.name).toBe('E2E User');
      expect(response.body.user.role).toBe('USER');
      expect(response.body.user.passwordHash).toBeUndefined();
    });

    it('should reject registration with duplicate email (409 Conflict)', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: testEmail,
          password: 'AnotherPassword123!',
          name: 'Duplicate User',
        })
        .expect(409);

      expect(response.body).toMatchObject({
        statusCode: 409,
        error: 'Conflict',
      });
    });

    it('should reject registration with ADMIN role (400 Bad Request)', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: 'e2e-auth-admin@example.com',
          password: 'Password123!',
          name: 'Hacker Admin',
          role: 'ADMIN',
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });
  });

  describe('POST /v1/auth/login', () => {
    const loginEmail = 'e2e-auth-login@example.com';
    const password = 'CorrectPassword123!';

    beforeAll(async () => {
      await request(app.getHttpServer()).post('/v1/auth/register').send({
        email: loginEmail,
        password,
        name: 'Login User',
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: loginEmail,
          password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(loginEmail);
    });

    it('should fail with 401 on incorrect password', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: loginEmail,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.statusCode).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should fail with 401 on non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password,
        })
        .expect(401);
    });
  });

  describe('POST /v1/auth/refresh (rotation & reuse detection)', () => {
    const refreshEmail = 'e2e-auth-refresh@example.com';
    let initialRefreshToken: string;
    let rotatedRefreshToken: string;

    beforeAll(async () => {
      const regResponse = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: refreshEmail,
          password: 'Password123!',
          name: 'Refresh User',
        });
      initialRefreshToken = regResponse.body.refreshToken;
    });

    it('should rotate refresh token and return a new token pair', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: initialRefreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.refreshToken).not.toBe(initialRefreshToken);

      rotatedRefreshToken = response.body.refreshToken;
    });

    it('should trigger reuse detection when presenting the revoked initial token', async () => {
      // initialRefreshToken was revoked during rotation. Presenting it again must trigger reuse detection.
      const response = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: initialRefreshToken })
        .expect(401);

      expect(response.body.message).toContain('reuse detected');
    });

    it('should ensure the rotated token was also revoked by reuse detection', async () => {
      // Because reuse was detected above, all active tokens for that user must now be revoked
      const response = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: rotatedRefreshToken })
        .expect(401);

      expect(response.body.statusCode).toBe(401);
    });
  });

  describe('POST /v1/auth/logout', () => {
    const logoutEmail = 'e2e-auth-logout@example.com';
    let accessToken: string;
    let refreshToken: string;

    beforeAll(async () => {
      const regResponse = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          email: logoutEmail,
          password: 'Password123!',
          name: 'Logout User',
        });
      accessToken = regResponse.body.accessToken;
      refreshToken = regResponse.body.refreshToken;
    });

    it('should reject unauthenticated logout request with 401', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/logout')
        .send({})
        .expect(401);
    });

    it('should successfully logout with valid Bearer token and revoke session', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toEqual({ message: 'Successfully logged out' });

      // Refresh token must now be revoked
      await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });
});
