import {
  BadRequestException,
  Injectable,
  ValidationPipe,
  type ValidationError,
} from '@nestjs/common';

// Global pipe (APP_PIPE in CoreModule): validates every @Body()/@Query() DTO.
// Unknown fields are stripped; errors use Nest's default shape plus `data: []`.
@Injectable()
export class AppValidationPipe extends ValidationPipe {
  constructor() {
    super({ transform: true, whitelist: true });
  }

  createExceptionFactory() {
    return (errors: ValidationError[] = []) =>
      new BadRequestException({
        statusCode: 400,
        message: this.flattenValidationErrors(errors),
        error: 'Bad Request',
        data: [],
      });
  }
}
