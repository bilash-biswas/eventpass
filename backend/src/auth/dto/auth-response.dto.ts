import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT bearer access token',
  })
  accessToken!: string;

  @ApiProperty({
    example: '8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a',
    description: 'Cryptographically random refresh token',
  })
  refreshToken!: string;

  @ApiProperty({
    type: UserResponseDto,
    description: 'Authenticated user profile details',
  })
  user!: UserResponseDto;
}
