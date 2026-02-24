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
  @IsInt()
  @Min(1)
  id: number;

  @IsISO8601()
  date: string;

  @IsString()
  label: string;

  @IsNumber()
  amount: number;
}

export class BalanceDto {
  @IsISO8601()
  date: string;

  @IsNumber()
  balance: number;
}

export class ValidateMovementsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MovementDto)
  movements: MovementDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BalanceDto)
  balances: BalanceDto[];
}
