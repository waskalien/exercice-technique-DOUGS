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
            difference: number;
          }>;
        };
        expect(body.message).toBe('Validation failed');
        expect(body.reasons).toHaveLength(1);
        expect(body.reasons[0].kind).toBe('BALANCE_MISMATCH');
        expect(body.reasons[0].date).toBe('2024-01-31');
        expect(body.reasons[0].expectedBalance).toBe(99);
        expect(body.reasons[0].difference).toBe(1);
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
});
