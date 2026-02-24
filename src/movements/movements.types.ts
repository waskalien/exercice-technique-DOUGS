export type ValidationReason =
  | {
      kind: 'DUPLICATE_IDS';
      duplicateIds: number[];
      message: string;
    }
  | {
      kind: 'BALANCE_MISMATCH';
      date: string;
      expectedBalance: number;
      computedSum: number;
      difference: number;
      message: string;
    };

export type ValidationResult =
  | { valid: true }
  | { valid: false; reasons: ValidationReason[] };
