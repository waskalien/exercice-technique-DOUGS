import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ValidateMovementsDto } from './dto/validate-movements.dto';
import { MovementsService } from './movements.service';

@Controller('movements')
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Post('validation')
  @HttpCode(HttpStatus.OK)
  validate(@Body() body: ValidateMovementsDto) {
    const result = this.movementsService.validate(body);
    return result.valid
      ? { message: 'Accepted' }
      : { message: 'Validation failed', reasons: result.reasons };
  }
}
