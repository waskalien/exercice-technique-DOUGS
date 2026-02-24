import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'http';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('POST /movements/validation (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 and Accepted when movements match balance checkpoints', () => {
    return request(httpServer)
      .post('/movements/validation')
      .send({
        movements: [
          { id: 1, date: '2024-01-10', label: 'Virement', amount: 100 },
          { id: 2, date: '2024-01-20', label: 'Prélèvement', amount: -30 },
        ],
        balances: [{ date: '2024-01-31', balance: 70 }],
      })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toEqual({ message: 'Accepted' });
      });
  });

  it('returns 422 and reasons when business validation fails (balance mismatch)', () => {
    return request(httpServer)
      .post('/movements/validation')
      .send({
        movements: [
          { id: 1, date: '2024-01-10', label: 'Opération', amount: 100 },
        ],
        balances: [{ date: '2024-01-31', balance: 99 }],
      })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect((res) => {
        const body = res.body as {
          message: string;
          reasons: Array<{
            kind: string;
            date: string;
            expectedBalance: number;
            computedSum: number;
            difference: number;
            message: string;
          }>;
        };
        expect(body.message).toBe('Validation failed');
        expect(body.reasons).toHaveLength(1);
        expect(body.reasons[0].kind).toBe('BALANCE_MISMATCH');
        expect(body.reasons[0].date).toBe('2024-01-31');
        expect(body.reasons[0].expectedBalance).toBe(99);
        expect(body.reasons[0].computedSum).toBe(100);
        expect(body.reasons[0].difference).toBe(1);
        expect(body.reasons[0].message).toContain('écart +1');
      });
  });

  it('returns 422 with DUPLICATE_IDS when movement ids are duplicated', () => {
    return request(httpServer)
      .post('/movements/validation')
      .send({
        movements: [
          { id: 1, date: '2024-01-10', label: 'A', amount: 100 },
          { id: 1, date: '2024-01-11', label: 'B', amount: 50 },
        ],
        balances: [{ date: '2024-01-31', balance: 150 }],
      })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect((res) => {
        const body = res.body as {
          message: string;
          reasons: Array<{
            kind: string;
            duplicateIds: number[];
            message: string;
          }>;
        };
        expect(body.message).toBe('Validation failed');
        expect(body.reasons).toHaveLength(1);
        expect(body.reasons[0].kind).toBe('DUPLICATE_IDS');
        expect(body.reasons[0].duplicateIds).toEqual([1]);
        expect(body.reasons[0].message).toContain('double');
      });
  });

  it('returns 422 with both DUPLICATE_IDS and BALANCE_MISMATCH when applicable', () => {
    return request(httpServer)
      .post('/movements/validation')
      .send({
        movements: [
          { id: 1, date: '2024-01-10', label: 'A', amount: 100 },
          { id: 1, date: '2024-01-11', label: 'B', amount: 50 },
        ],
        balances: [{ date: '2024-01-31', balance: 99 }],
      })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect((res) => {
        const body = res.body as {
          message: string;
          reasons: Array<
            | { kind: string; duplicateIds: number[] }
            | {
                kind: string;
                date: string;
                expectedBalance: number;
                computedSum: number;
                difference: number;
              }
          >;
        };
        expect(body.message).toBe('Validation failed');
        expect(body.reasons).toHaveLength(2);
        const duplicateReason = body.reasons.find(
          (r) => r.kind === 'DUPLICATE_IDS',
        );
        const balanceReason = body.reasons.find(
          (r) => r.kind === 'BALANCE_MISMATCH',
        );
        expect(duplicateReason).toBeDefined();
        expect(
          (duplicateReason as { duplicateIds: number[] }).duplicateIds,
        ).toEqual([1]);
        expect(balanceReason).toBeDefined();
        expect((balanceReason as { date: string }).date).toBe('2024-01-31');
        expect(
          (balanceReason as { expectedBalance: number }).expectedBalance,
        ).toBe(99);
      });
  });

  it('returns 200 when balances are sent in non-chronological order', () => {
    return request(httpServer)
      .post('/movements/validation')
      .send({
        movements: [
          { id: 1, date: '2024-01-10', label: 'A', amount: 100 },
          { id: 2, date: '2024-01-20', label: 'B', amount: 50 },
          { id: 3, date: '2024-02-05', label: 'C', amount: -20 },
        ],
        balances: [
          { date: '2024-02-28', balance: 130 },
          { date: '2024-01-15', balance: 100 },
          { date: '2024-01-31', balance: 150 },
        ],
      })
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body).toEqual({ message: 'Accepted' });
      });
  });

  it('returns 400 when request body is invalid (missing fields)', () => {
    return request(httpServer)
      .post('/movements/validation')
      .send({
        movements: [{ id: 1, date: '2024-01-10' }], // label and amount missing
        balances: [{ date: '2024-01-31', balance: 100 }],
      })
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('returns 400 when request body has wrong types (id and amount as strings)', () => {
    return request(httpServer)
      .post('/movements/validation')
      .send({
        movements: [
          { id: '1', date: '2024-01-10', label: 'Opération', amount: '100' },
        ],
        balances: [{ date: '2024-01-31', balance: 100 }],
      })
      .expect(HttpStatus.BAD_REQUEST);
  });
});
