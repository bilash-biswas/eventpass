import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'alex@example.com',
    description: 'Unique email address',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'Str0ngP@ssw0rd!',
    description: 'Password with minimum 8 characters',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @ApiProperty({
    example: 'Alex Johnson',
    description: 'User full display name',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name!: string;

  @ApiPropertyOptional({
    enum: [Role.USER, Role.ORGANIZER],
    default: Role.USER,
    description:
      'User role (USER or ORGANIZER). Cannot self-register as ADMIN.',
  })
  @IsOptional()
  @IsEnum(Role, { message: 'Role must be a valid role (USER or ORGANIZER)' })
  role?: Role;
}
