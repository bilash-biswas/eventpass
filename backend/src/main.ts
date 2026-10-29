import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const corsOriginsRaw = configService.get<string>(
    'CORS_ORIGIN',
    'http://localhost:3000,http://localhost:3001',
  );
  const allowedOrigins = corsOriginsRaw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // Security Headers via Helmet
  app.use(helmet());

  // CORS Configuration
  app.enableCors({
    origin: allowedOrigins.includes('*') ? true : allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  });

  // Global Route Prefix
  app.setGlobalPrefix('v1', {
    exclude: ['/docs', '/docs-json'],
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('EventPass API')
    .setDescription(
      'Production-ready REST API for EventPass ticketing and RSVP platform',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT access token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health', 'System and database health checks')
    .addTag('Auth', 'Authentication and session management')
    .addTag('Users', 'User profile endpoints')
    .addTag('Events', 'Event management and public listings')
    .addTag('Tickets', 'RSVP, ticket issuance, and check-in')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'EventPass API Documentation',
  });

  await app.listen(port);
  logger.log(`🚀 EventPass API running in ${nodeEnv} mode on port ${port}`);
  logger.log(
    `📚 Swagger documentation available at: http://localhost:${port}/docs`,
  );
}

void bootstrap();
