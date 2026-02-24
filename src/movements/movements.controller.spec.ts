import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MovementsController } from './movements.controller';
import { MovementsService } from './movements.service';

describe('MovementsController', () => {
  let controller: MovementsController;
  let validateMock: jest.Mock;

  beforeEach(async () => {
    validateMock = jest.fn().mockReturnValue({ valid: true });
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MovementsController],
      providers: [
        {
          provide: MovementsService,
          useValue: { validate: validateMock },
        },
      ],
    }).compile();

    controller = module.get(MovementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return 200 with message Accepted when validation succeeds', () => {
    const body = {
      movements: [
        { id: 1, date: '2024-01-15', label: 'Opération', amount: 100 },
      ],
      balances: [{ date: '2024-01-31', balance: 1000 }],
    };
    const result = controller.validate(body);
    expect(result).toEqual({ message: 'Accepted' });
    expect(validateMock).toHaveBeenCalledWith(body);
  });

  it('should throw 422 with message and reasons when validation fails', () => {
    const reasons = [
      {
        kind: 'BALANCE_MISMATCH',
        date: '',
        expectedBalance: 0,
        computedSum: 0,
        difference: 0,
        message: '',
      },
    ];
    validateMock.mockReturnValue({ valid: false, reasons });
    const body = {
      movements: [{ id: 1, date: '2024-01-10', label: 'X', amount: 0 }],
      balances: [{ date: '2024-01-31', balance: 0 }],
    };
    try {
      controller.validate(body);
      throw new Error('Expected controller to throw HttpException');
    } catch (e: unknown) {
      if (
        e instanceof Error &&
        e.message === 'Expected controller to throw HttpException'
      )
        throw e;
      expect(e).toBeInstanceOf(HttpException);
      if (e instanceof HttpException) {
        expect(e.getStatus()).toBe(422);
        expect(e.getResponse()).toEqual({
          message: 'Validation failed',
          reasons,
        });
      }
    }
    expect(validateMock).toHaveBeenCalledWith(body);
  });
});
