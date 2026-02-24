import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  AcceptedResponseDto,
  ValidationFailedResponseDto,
} from './dto/validate-movements-response.dto';
import { ValidateMovementsDto } from './dto/validate-movements.dto';
import { MovementsService } from './movements.service';

@ApiTags('movements')
@Controller('movements')
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Post('validation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate movements and balances',
    description: '200 if OK, 422 on duplicates or balance mismatch.',
  })
  @ApiBody({ type: ValidateMovementsDto })
  @ApiResponse({ status: 200, description: 'OK', type: AcceptedResponseDto })
  @ApiResponse({
    status: 422,
    description: 'Duplicates or balance mismatch',
    type: ValidationFailedResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid body' })
  validate(@Body() body: ValidateMovementsDto): AcceptedResponseDto {
    const result = this.movementsService.validate(body);
    if (!result.valid) {
      const response: ValidationFailedResponseDto = {
        message: 'Validation failed',
        reasons: result.reasons,
      };
      throw new HttpException(response, HttpStatus.UNPROCESSABLE_ENTITY);
    }
    return { message: 'Accepted' };
  }
}
