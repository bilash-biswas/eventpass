import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: '8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a',
    description: 'Current active refresh token for rotation',
  })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token must be provided' })
  refreshToken!: string;
}
