import { Injectable, Logger } from '@nestjs/common';
import { ValidateMovementsDto } from './dto/validate-movements.dto';

@Injectable()
export class MovementsService {
  private readonly logger = new Logger(MovementsService.name);

  validate(body: ValidateMovementsDto): boolean {
    this.logger.log(
      `Validation request: ${body.movements.length} movements, ${body.balances.length} balance(s)`,
    );
    // TODO: implement validation algorithm
    return true;
  }
}
