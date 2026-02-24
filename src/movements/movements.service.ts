import { Injectable } from '@nestjs/common';
import {
  ValidationReasonDto,
  ValidationResult,
} from './dto/validate-movements-response.dto';
import {
  BalanceDto,
  MovementDto,
  ValidateMovementsDto,
} from './dto/validate-movements.dto';

@Injectable()
export class MovementsService {
  validate(body: ValidateMovementsDto): ValidationResult {
    const reasons: ValidationReasonDto[] = [];

    const duplicateIds = this.findDuplicateIds(body.movements.map((m) => m.id));
    if (duplicateIds.length > 0) {
      reasons.push({
        kind: 'DUPLICATE_IDS',
        duplicateIds,
        message: `Opérations en double, à fusionner ou supprimer.`,
      });
    }

    const balanceReasons = this.checkBalances(body.movements, body.balances);
    reasons.push(...balanceReasons);

    if (reasons.length > 0) return { valid: false, reasons };
    return { valid: true };
  }

  private checkBalances(
    movements: MovementDto[],
    balances: BalanceDto[],
  ): ValidationReasonDto[] {
    const reasons: ValidationReasonDto[] = [];
    const sortedBalances = [...balances].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    for (const { date, balance } of sortedBalances) {
      const limit = new Date(date).getTime();
      const sum = movements
        .filter((m) => new Date(m.date).getTime() <= limit)
        .reduce((acc, m) => acc + m.amount, 0);

      if (!this.amountsEqual(sum, balance)) {
        const difference = this.roundToCents(sum - balance);
        const roundedSum = this.roundToCents(sum);
        reasons.push({
          kind: 'BALANCE_MISMATCH',
          date,
          expectedBalance: balance,
          computedSum: roundedSum,
          difference,
          message: this.buildBalanceMismatchMessage(
            date,
            balance,
            roundedSum,
            difference,
          ),
        });
      }
    }
    return reasons;
  }

  private findDuplicateIds(ids: number[]): number[] {
    const seen = new Set<number>();
    const duplicates = new Set<number>();
    for (const id of ids) {
      if (seen.has(id)) duplicates.add(id);
      else seen.add(id);
    }
    return [...duplicates].sort((a, b) => a - b);
  }

  private buildBalanceMismatchMessage(
    date: string,
    expectedBalance: number,
    computedSum: number,
    difference: number,
  ): string {
    const base = `Au ${date}: attendu ${expectedBalance}, calculé ${computedSum}`;
    return difference > 0
      ? `${base} (écart +${difference}). Doublons ou opérations en trop.`
      : `${base} (écart ${difference}). Opérations manquantes.`;
  }

  private amountsEqual(a: number, b: number): boolean {
    return Math.round(a * 100) === Math.round(b * 100);
  }

  private roundToCents(x: number): number {
    return Math.round(x * 100) / 100;
  }
}
