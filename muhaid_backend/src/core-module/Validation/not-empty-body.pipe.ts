import {
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';

// PATCH bodies: @Body(NotEmptyBodyPipe). Runs after the global pipe, so only
// whitelisted DTO fields are counted.
@Injectable()
export class NotEmptyBodyPipe implements PipeTransform {
  transform<T extends object>(value: T): T {
    const fields = Object.values(value ?? {}).filter((v) => v !== undefined);
    if (!fields.length) throw new BadRequestException('Nothing to update');
    return value;
  }
}
