import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { createValidationPipe } from '../src/common/pipes/validation.pipe';
import {
  AcceptedResponseDto,
  ValidationFailedResponseDto,
} from '../src/movements/dto/validate-movements-response.dto';
import {
  balanceMismatch,
  duplicateIds,
  duplicateIdsAndBalanceMismatch,
  invalidMissingFields,
  invalidWrongTypes,
  nonChronologicalBalances,
  validSingleCheckpoint,
} from './fixtures/movements';

describe('POST /movements/validation (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(createValidationPipe());

    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 and Accepted when movements match balance checkpoints', () => {
    return request(httpServer)
      .post('/movements/validation')
      .send(validSingleCheckpoint())
      .expect(HttpStatus.OK)
      .expect((res) => {
        const body = res.body as AcceptedResponseDto;
        expect(body).toEqual({ message: 'Accepted' });
      });
  });

  it('returns 422 and reasons when business validation fails (balance mismatch)', () => {
    return request(httpServer)
      .post('/movements/validation')
      .send(balanceMismatch())
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect((res) => {
        const body = res.body as ValidationFailedResponseDto;
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
      .send(duplicateIds())
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect((res) => {
        const body = res.body as ValidationFailedResponseDto;
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
      .send(duplicateIdsAndBalanceMismatch())
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect((res) => {
        const body = res.body as ValidationFailedResponseDto;
        expect(body.message).toBe('Validation failed');
        expect(body.reasons).toHaveLength(2);
        const duplicateReason = body.reasons.find(
          (r) => r.kind === 'DUPLICATE_IDS',
        );
        const balanceReason = body.reasons.find(
          (r) => r.kind === 'BALANCE_MISMATCH',
        );
        expect(duplicateReason).toBeDefined();
        expect(duplicateReason!.duplicateIds).toEqual([1]);
        expect(balanceReason).toBeDefined();
        expect(balanceReason!.date).toBe('2024-01-31');
        expect(balanceReason!.expectedBalance).toBe(99);
      });
  });

  it('returns 200 when balances are sent in non-chronological order', () => {
    return request(httpServer)
      .post('/movements/validation')
      .send(nonChronologicalBalances())
      .expect(HttpStatus.OK)
      .expect((res) => {
        const body = res.body as AcceptedResponseDto;
        expect(body).toEqual({ message: 'Accepted' });
      });
  });

  it('returns 400 when request body is invalid (missing fields)', () => {
    return request(httpServer)
      .post('/movements/validation')
      .send(invalidMissingFields())
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('returns 400 when request body has wrong types (id and amount as strings)', () => {
    return request(httpServer)
      .post('/movements/validation')
      .send(invalidWrongTypes())
      .expect(HttpStatus.BAD_REQUEST);
  });
});
