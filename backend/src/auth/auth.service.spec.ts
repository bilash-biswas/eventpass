import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password_123'),
  verify: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'user@example.com',
    passwordHash: 'hashed_password_123',
    name: 'Test User',
    role: Role.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            refreshToken: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock_jwt_access_token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest
              .fn()
              .mockImplementation((key: string, defaultValue: unknown) => {
                if (key === 'JWT_REFRESH_EXPIRATION_DAYS') return 7;
                return defaultValue;
              }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('register', () => {
    it('should reject registration with ADMIN role', async () => {
      await expect(
        service.register({
          email: 'admin@example.com',
          password: 'Password123!',
          name: 'Admin',
          role: Role.ADMIN,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject registration if email is already taken', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'user@example.com',
          password: 'Password123!',
          name: 'Test User',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully register a new user and return tokens', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser);
      jest.spyOn(prisma.refreshToken, 'create').mockResolvedValue({} as never);

      const result = await service.register({
        email: 'user@example.com',
        password: 'Password123!',
        name: 'Test User',
      });

      expect(result.accessToken).toBe('mock_jwt_access_token');
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe(mockUser.email);
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user does not exist', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.login({
          email: 'notfound@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({
          email: 'user@example.com',
          password: 'WrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens on valid credentials', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      jest.spyOn(prisma.refreshToken, 'create').mockResolvedValue({} as never);

      const result = await service.login({
        email: 'user@example.com',
        password: 'CorrectPassword',
      });

      expect(result.accessToken).toBe('mock_jwt_access_token');
      expect(result.refreshToken).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);
    });
  });

  describe('refresh', () => {
    const rawToken = 'raw_refresh_token_test_123';
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    it('should throw UnauthorizedException if refresh token is not found', async () => {
      jest.spyOn(prisma.refreshToken, 'findUnique').mockResolvedValue(null);

      await expect(service.refresh(rawToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should detect reuse: revoke all active tokens when a revoked token is presented', async () => {
      const revokedTokenRecord = {
        id: 'token-1',
        tokenHash,
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: new Date(Date.now() - 5000),
        user: mockUser,
      };

      jest
        .spyOn(prisma.refreshToken, 'findUnique')
        .mockResolvedValue(revokedTokenRecord as never);
      jest
        .spyOn(prisma.refreshToken, 'updateMany')
        .mockResolvedValue({ count: 2 });

      await expect(service.refresh(rawToken)).rejects.toThrow(
        'Invalid refresh token: reuse detected',
      );

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          revokedAt: null,
        },
        data: {
          revokedAt: expect.any(Date),
        },
      });
    });

    it('should throw UnauthorizedException if refresh token has expired', async () => {
      const expiredTokenRecord = {
        id: 'token-1',
        tokenHash,
        userId: mockUser.id,
        expiresAt: new Date(Date.now() - 10000),
        revokedAt: null,
        user: mockUser,
      };

      jest
        .spyOn(prisma.refreshToken, 'findUnique')
        .mockResolvedValue(expiredTokenRecord as never);
      jest.spyOn(prisma.refreshToken, 'update').mockResolvedValue({} as never);

      await expect(service.refresh(rawToken)).rejects.toThrow(
        'Refresh token has expired',
      );

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: expiredTokenRecord.id },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should successfully rotate tokens for a valid refresh token', async () => {
      const validTokenRecord = {
        id: 'token-1',
        tokenHash,
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: null,
        user: mockUser,
      };

      jest
        .spyOn(prisma.refreshToken, 'findUnique')
        .mockResolvedValue(validTokenRecord as never);
      jest.spyOn(prisma.refreshToken, 'update').mockResolvedValue({} as never);
      jest.spyOn(prisma.refreshToken, 'create').mockResolvedValue({} as never);

      const result = await service.refresh(rawToken);

      expect(result.accessToken).toBe('mock_jwt_access_token');
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).not.toBe(rawToken);
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: validTokenRecord.id },
        data: { revokedAt: expect.any(Date) },
      });
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should revoke all tokens if no specific refresh token provided', async () => {
      jest
        .spyOn(prisma.refreshToken, 'updateMany')
        .mockResolvedValue({ count: 1 });

      const result = await service.logout(mockUser.id);
      expect(result.message).toBe('Successfully logged out');
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          revokedAt: null,
        },
        data: {
          revokedAt: expect.any(Date),
        },
      });
    });

    it('should revoke specific refresh token when provided', async () => {
      jest
        .spyOn(prisma.refreshToken, 'updateMany')
        .mockResolvedValue({ count: 1 });

      const result = await service.logout(mockUser.id, 'some_token');
      expect(result.message).toBe('Successfully logged out');
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          tokenHash: expect.any(String),
          userId: mockUser.id,
          revokedAt: null,
        },
        data: {
          revokedAt: expect.any(Date),
        },
      });
    });
  });
});
