import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsISO8601,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class MovementDto {
  @ApiProperty({ description: 'Operation ID', example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  id: number;

  @ApiProperty({ description: 'Date (ISO 8601)', example: '2024-01-10' })
  @IsISO8601()
  date: string;

  @ApiProperty({ description: 'Label', example: 'Transfer' })
  @IsString()
  label: string;

  @ApiProperty({ description: 'Amount (€)', example: 100 })
  @IsNumber()
  amount: number;
}

export class BalanceDto {
  @ApiProperty({ description: 'Checkpoint (ISO 8601)', example: '2024-01-31' })
  @IsISO8601()
  date: string;

  @ApiProperty({ description: 'Expected balance (€)', example: 100 })
  @IsNumber()
  balance: number;
}

export class ValidateMovementsDto {
  @ApiProperty({ type: [MovementDto], description: 'Movements' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MovementDto)
  movements: MovementDto[];

  @ApiProperty({ type: [BalanceDto], description: 'Balance checkpoints' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BalanceDto)
  balances: BalanceDto[];
}
