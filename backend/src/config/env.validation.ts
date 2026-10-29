import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32, {
    message: 'JWT_ACCESS_SECRET must be at least 32 characters long',
  })
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_EXPIRATION: string = '15m';

  @IsString()
  @MinLength(32, {
    message: 'JWT_REFRESH_SECRET must be at least 32 characters long',
  })
  JWT_REFRESH_SECRET!: string;

  @IsInt()
  @Min(1)
  JWT_REFRESH_EXPIRATION_DAYS: number = 7;

  @IsString()
  @IsNotEmpty()
  CORS_ORIGIN: string = 'http://localhost:3000,http://localhost:3001';

  @IsInt()
  @Min(1000)
  THROTTLE_TTL: number = 60000;

  @IsInt()
  @Min(1)
  THROTTLE_LIMIT: number = 100;
}

export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const formattedErrors = errors
      .map(
        (err) =>
          `Property "${err.property}": ${Object.values(err.constraints || {}).join(', ')}`,
      )
      .join('\n');
    throw new Error(`Environment validation failed:\n${formattedErrors}`);
  }

  return validatedConfig;
}
