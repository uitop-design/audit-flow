import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

export interface ValidationIssue {
  field: string;
  message: string;
}

export class RequestValidationException extends BadRequestException {
  constructor(readonly issues: readonly ValidationIssue[]) {
    super('Request validation failed');
  }
}

/** Flattens class-validator's nested error tree into `field.path: message` pairs. */
export function flattenValidationErrors(
  errors: readonly ValidationError[],
  parentPath = '',
): ValidationIssue[] {
  return errors.flatMap((error) => {
    const field = parentPath ? `${parentPath}.${error.property}` : error.property;
    const own = Object.values(error.constraints ?? {}).map((message) => ({ field, message }));
    return [...own, ...flattenValidationErrors(error.children ?? [], field)];
  });
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    // One message per field. class-validator evaluates decorators bottom-up, so DTOs place the most
    // basic check (e.g. @IsString) closest to the property.
    stopAtFirstError: true,
    validationError: { target: false, value: false },
    exceptionFactory: (errors) => new RequestValidationException(flattenValidationErrors(errors)),
  });
}
