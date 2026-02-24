type MovementPayload = {
  id: number;
  date: string;
  wording: string;
  amount: number;
};

type BalancePayload = { date: string; balance: number };

type ValidationBody = {
  movements: MovementPayload[];
  balances: BalancePayload[];
};

export const validSingleCheckpoint = (): ValidationBody => ({
  movements: [
    { id: 1, date: '2024-01-10', wording: 'A', amount: 100 },
    { id: 2, date: '2024-01-20', wording: 'B', amount: -30 },
  ],
  balances: [{ date: '2024-01-31', balance: 70 }],
});

export const validMultipleCheckpoints = (): ValidationBody => ({
  movements: [
    { id: 1, date: '2024-01-10', wording: 'A', amount: 100 },
    { id: 2, date: '2024-01-20', wording: 'B', amount: 50 },
    { id: 3, date: '2024-02-05', wording: 'C', amount: -20 },
  ],
  balances: [
    { date: '2024-01-15', balance: 100 },
    { date: '2024-01-31', balance: 150 },
    { date: '2024-02-28', balance: 130 },
  ],
});

export const balanceMismatch = (): ValidationBody => ({
  movements: [{ id: 1, date: '2024-01-10', wording: 'A', amount: 100 }],
  balances: [{ date: '2024-01-31', balance: 99 }],
});

export const duplicateIds = (): ValidationBody => ({
  movements: [
    { id: 1, date: '2024-01-10', wording: 'A', amount: 100 },
    { id: 1, date: '2024-01-11', wording: 'B', amount: 50 },
  ],
  balances: [{ date: '2024-01-31', balance: 150 }],
});

export const duplicateIdsAndBalanceMismatch = (): ValidationBody => ({
  movements: [
    { id: 1, date: '2024-01-10', wording: 'A', amount: 100 },
    { id: 1, date: '2024-01-11', wording: 'B', amount: 50 },
  ],
  balances: [{ date: '2024-01-31', balance: 99 }],
});

export const floatPrecision = (): ValidationBody => ({
  movements: [
    { id: 1, date: '2024-01-10', wording: 'A', amount: 0.1 },
    { id: 2, date: '2024-01-10', wording: 'B', amount: 0.2 },
    { id: 3, date: '2024-01-10', wording: 'C', amount: 0.3 },
  ],
  balances: [{ date: '2024-01-31', balance: 0.6 }],
});

export const nonChronologicalBalances = (): ValidationBody => ({
  movements: [
    { id: 1, date: '2024-01-10', wording: 'A', amount: 100 },
    { id: 2, date: '2024-01-20', wording: 'B', amount: 50 },
    { id: 3, date: '2024-02-05', wording: 'C', amount: -20 },
  ],
  balances: [
    { date: '2024-02-28', balance: 130 },
    { date: '2024-01-15', balance: 100 },
    { date: '2024-01-31', balance: 150 },
  ],
});

export const validMinimal = (): ValidationBody => ({
  movements: [{ id: 1, date: '2024-01-15', wording: 'Opération', amount: 100 }],
  balances: [{ date: '2024-01-31', balance: 100 }],
});

export const anyValidBody = (): ValidationBody => ({
  movements: [{ id: 1, date: '2024-01-10', wording: 'X', amount: 0 }],
  balances: [{ date: '2024-01-31', balance: 0 }],
});

export const invalidMissingFields = () => ({
  movements: [{ id: 1, date: '2024-01-10' }],
  balances: [{ date: '2024-01-31', balance: 100 }],
});

export const invalidWrongTypes = () => ({
  movements: [
    {
      id: '1',
      date: '2024-01-10',
      wording: 'Opération',
      amount: '100',
    },
  ],
  balances: [{ date: '2024-01-31', balance: 100 }],
});
