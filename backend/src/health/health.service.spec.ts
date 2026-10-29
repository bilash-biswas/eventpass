import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return healthy status when database is reachable', async () => {
    jest.spyOn(prisma, '$queryRaw').mockResolvedValue([{ 1: 1 }] as never);

    const result = await service.check();
    expect(result.status).toBe('ok');
    expect(result.database).toBe('healthy');
    expect(result.timestamp).toBeDefined();
  });

  it('should throw ServiceUnavailableException when database is unreachable', async () => {
    jest
      .spyOn(prisma, '$queryRaw')
      .mockRejectedValue(new Error('Connection failed'));

    await expect(service.check()).rejects.toThrow(ServiceUnavailableException);
  });
});
