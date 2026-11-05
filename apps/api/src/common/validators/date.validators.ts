import {
  isISO8601,
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

// Requires a time and an explicit offset, so the meaning never depends on the server's time zone.
const DATE_TIME_WITH_OFFSET =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})$/;

export function isIsoDateTimeWithOffset(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    DATE_TIME_WITH_OFFSET.test(value) &&
    isISO8601(value, { strict: true, strictSeparator: true })
  );
}

/** ISO 8601 date-time with an explicit time zone, e.g. `2026-11-05T00:00:00Z`. */
export function IsIsoDateTimeWithOffset(options?: ValidationOptions): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      name: 'isIsoDateTimeWithOffset',
      target: target.constructor,
      propertyName: String(propertyName),
      options: {
        message:
          '$property must be an ISO 8601 date-time with a time zone, e.g. 2026-11-05T00:00:00Z',
        ...options,
      },
      validator: { validate: isIsoDateTimeWithOffset },
    });
  };
}

/** Requires this date-time to be strictly later than another date-time property, when both are set. */
export function IsLaterThan(property: string, options?: ValidationOptions): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      name: 'isLaterThan',
      target: target.constructor,
      propertyName: String(propertyName),
      constraints: [property],
      options: { message: `$property must be later than ${property}`, ...options },
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const other: unknown = (args.object as Record<string, unknown>)[property];
          if (!isIsoDateTimeWithOffset(value) || !isIsoDateTimeWithOffset(other)) {
            return true; // Format is reported by the format validators.
          }
          return Date.parse(value) > Date.parse(other);
        },
      },
    });
  };
}
