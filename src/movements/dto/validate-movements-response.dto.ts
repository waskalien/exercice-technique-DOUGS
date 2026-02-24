import { ApiProperty } from '@nestjs/swagger';

export class ValidationReasonDto {
  @ApiProperty({ enum: ['DUPLICATE_IDS', 'BALANCE_MISMATCH'] })
  kind: 'DUPLICATE_IDS' | 'BALANCE_MISMATCH';

  @ApiProperty({ type: [Number], required: false })
  duplicateIds?: number[];

  @ApiProperty({ required: false })
  date?: string;

  @ApiProperty({ required: false })
  expectedBalance?: number;

  @ApiProperty({ required: false })
  computedSum?: number;

  @ApiProperty({ required: false })
  difference?: number;

  @ApiProperty()
  message: string;
}

export class ValidationFailedResponseDto {
  @ApiProperty({ example: 'Validation failed' })
  message: string;

  @ApiProperty({ type: [ValidationReasonDto] })
  reasons: ValidationReasonDto[];
}

export class AcceptedResponseDto {
  @ApiProperty({ example: 'Accepted' })
  message: string;
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; reasons: ValidationReasonDto[] };
