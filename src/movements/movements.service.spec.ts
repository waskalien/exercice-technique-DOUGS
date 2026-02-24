import { Test, TestingModule } from '@nestjs/testing';
import {
  balanceMismatch,
  duplicateIds,
  floatPrecision,
  validMultipleCheckpoints,
  validSingleCheckpoint,
} from '../../test/fixtures/movements';
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
    expect(service.validate(validSingleCheckpoint())).toEqual({ valid: true });
  });

  it('should accept multiple checkpoints in chronological order', () => {
    expect(service.validate(validMultipleCheckpoints())).toEqual({
      valid: true,
    });
  });

  it('should reject when balance does not match sum at checkpoint', () => {
    const result = service.validate(balanceMismatch());
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
    const result = service.validate(duplicateIds());
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
    expect(service.validate(floatPrecision())).toEqual({ valid: true });
  });
});
