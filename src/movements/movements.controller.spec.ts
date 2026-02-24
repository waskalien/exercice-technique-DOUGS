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

  it('should return message and reasons when validation fails', () => {
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
    const result = controller.validate(body);
    expect(validateMock).toHaveBeenCalledWith(body);
    expect(result).toEqual({ message: 'Validation failed', reasons });
  });
});
