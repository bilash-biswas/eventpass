import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({
    example: 'd9b2d63d-a233-4123-8478-f7b8f9e61234',
    description: 'Unique user identifier (UUID)',
  })
  id!: string;

  @ApiProperty({
    example: 'alex@example.com',
    description: 'Unique user email address',
  })
  email!: string;

  @ApiProperty({
    example: 'Alex Johnson',
    description: 'Full name of the user',
  })
  name!: string;

  @ApiProperty({
    enum: Role,
    example: Role.USER,
    description: 'User access role',
  })
  role!: Role;

  @ApiProperty({
    example: '2026-10-29T01:00:00.000Z',
    description: 'User creation timestamp',
  })
  createdAt!: Date;
}
