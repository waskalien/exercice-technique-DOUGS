import { Injectable, Logger } from '@nestjs/common';
import { ValidateMovementsDto } from './dto/validate-movements.dto';
import { ValidationReason, ValidationResult } from './movements.types';

@Injectable()
export class MovementsService {
  private readonly logger = new Logger(MovementsService.name);

  validate(body: ValidateMovementsDto): ValidationResult {
    const { movements, balances } = body;

    const reasons: ValidationReason[] = [];

    const ids = movements.map((m) => m.id);
    const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
    const uniqueDuplicateIds = [...new Set(duplicateIds)];
    if (uniqueDuplicateIds.length > 0) {
      reasons.push({
        kind: 'DUPLICATE_IDS',
        duplicateIds: uniqueDuplicateIds.sort((a, b) => a - b),
        message: `Opérations en double, à fusionner ou supprimer.`,
      });
    }

    const sortedBalances = [...balances].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    for (const { date, balance } of sortedBalances) {
      const limit = new Date(date).getTime();
      const sum = movements
        .filter((m) => new Date(m.date).getTime() <= limit)
        .reduce((acc, m) => acc + m.amount, 0);

      if (!this.amountsEqual(sum, balance)) {
        const difference = Math.round((sum - balance) * 100) / 100;
        const roundedSum = Math.round(sum * 100) / 100;
        reasons.push({
          kind: 'BALANCE_MISMATCH',
          date,
          expectedBalance: balance,
          computedSum: roundedSum,
          difference,
          message:
            difference > 0
              ? `Au ${date}: attendu ${balance}, calculé ${roundedSum} (écart +${difference}). Doublons ou opérations en trop.`
              : `Au ${date}: attendu ${balance}, calculé ${roundedSum} (écart ${difference}). Opérations manquantes.`,
        });
      }
    }

    if (reasons.length > 0) return { valid: false, reasons };
    return { valid: true };
  }

  // Binary floats (IEEE 754) cause small rounding errors on decimals.
  private amountsEqual(a: number, b: number): boolean {
    return Math.round(a * 100) === Math.round(b * 100);
  }
}
