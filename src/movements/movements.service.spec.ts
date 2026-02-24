import { Test, TestingModule } from '@nestjs/testing';
import { MovementsService } from './movements.service';

describe('MovementsService', () => {
  let service: MovementsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MovementsService],
    }).compile();

    service = module.get(MovementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should accept when sum of movements until checkpoint date equals balance', () => {
    const body = {
      movements: [
        { id: 1, date: '2024-01-10', label: 'A', amount: 100 },
        { id: 2, date: '2024-01-20', label: 'B', amount: -30 },
      ],
      balances: [{ date: '2024-01-31', balance: 70 }],
    };
    expect(service.validate(body)).toEqual({ valid: true });
  });

  it('should accept multiple checkpoints in chronological order', () => {
    const body = {
      movements: [
        { id: 1, date: '2024-01-10', label: 'A', amount: 100 },
        { id: 2, date: '2024-01-20', label: 'B', amount: 50 },
        { id: 3, date: '2024-02-05', label: 'C', amount: -20 },
      ],
      balances: [
        { date: '2024-01-15', balance: 100 },
        { date: '2024-01-31', balance: 150 },
        { date: '2024-02-28', balance: 130 },
      ],
    };
    expect(service.validate(body)).toEqual({ valid: true });
  });

  it('should reject when balance does not match sum at checkpoint', () => {
    const body = {
      movements: [{ id: 1, date: '2024-01-10', label: 'A', amount: 100 }],
      balances: [{ date: '2024-01-31', balance: 99 }],
    };
    const result = service.validate(body);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reasons).toHaveLength(1);
      expect(result.reasons[0]).toMatchObject({
        kind: 'BALANCE_MISMATCH',
        date: '2024-01-31',
        expectedBalance: 99,
        difference: 1,
      });
    }
  });

  it('should reject duplicate movement ids', () => {
    const body = {
      movements: [
        { id: 1, date: '2024-01-10', label: 'A', amount: 100 },
        { id: 1, date: '2024-01-11', label: 'B', amount: 50 },
      ],
      balances: [{ date: '2024-01-31', balance: 150 }],
    };
    const result = service.validate(body);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reasons).toHaveLength(1);
      expect(result.reasons[0]).toMatchObject({
        kind: 'DUPLICATE_IDS',
        duplicateIds: [1],
      });
    }
  });

  it('should accept when sum equals balance despite float precision (0.1+0.2+0.3)', () => {
    const sum = 0.1 + 0.2 + 0.3;
    expect(sum).not.toBe(0.6); // in JS, binary floats make sum !== 0.6

    const body = {
      movements: [
        { id: 1, date: '2024-01-10', label: 'A', amount: 0.1 },
        { id: 2, date: '2024-01-10', label: 'B', amount: 0.2 },
        { id: 3, date: '2024-01-10', label: 'C', amount: 0.3 },
      ],
      balances: [{ date: '2024-01-31', balance: 0.6 }],
    };
    expect(service.validate(body)).toEqual({ valid: true });
  });
});
