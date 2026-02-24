import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ValidateMovementsDto } from './dto/validate-movements.dto';
import { MovementsService } from './movements.service';

@Controller('movements')
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Post('validation')
  @HttpCode(HttpStatus.OK)
  validate(@Body() body: ValidateMovementsDto) {
    const isValid = this.movementsService.validate(body);
    return {
      message: isValid ? 'Accepted' : 'Validation failed',
      ...(isValid ? {} : { reasons: [] }),
    };
  }
}
