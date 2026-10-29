import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';

async function exportOpenApi(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });

  app.setGlobalPrefix('v1', {
    exclude: ['/docs', '/docs-json', '/docs-yaml'],
  });

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

  const formattedJson = JSON.stringify(document, null, 2);

  // Export to backend directory
  const backendOutputPath = resolve(__dirname, '..', 'openapi.json');
  writeFileSync(backendOutputPath, formattedJson, 'utf-8');

  // Also write swagger.json alias
  const swaggerOutputPath = resolve(__dirname, '..', 'swagger.json');
  writeFileSync(swaggerOutputPath, formattedJson, 'utf-8');

  console.log(`[OpenAPI Export] Successfully generated OpenAPI specification:`);
  console.log(`  - ${backendOutputPath}`);
  console.log(`  - ${swaggerOutputPath}`);

  await app.close();
  process.exit(0);
}

void exportOpenApi().catch((err: unknown) => {
  console.error(
    '[OpenAPI Export] Failed to export OpenAPI specification:',
    err,
  );
  process.exit(1);
});
