import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class CheckInDto {
  @ApiProperty({
    example: 'TKT_9f8e7d6c5b4a3210fedcba9876543210',
    description: 'Cryptographically random ticket QR code value',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'Ticket code must be provided' })
  code!: string;
}
