import { registerDecorator, type ValidationOptions } from 'class-validator';
import { isJsonObject } from '../json.js';

/** Accepts plain JSON objects only: not arrays, strings, numbers or null. */
export function IsJsonObject(options?: ValidationOptions): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      name: 'isJsonObject',
      target: target.constructor,
      propertyName: String(propertyName),
      options: { message: '$property must be a JSON object', ...options },
      validator: { validate: (value: unknown) => isJsonObject(value) },
    });
  };
}

export function jsonByteLength(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value) ?? '', 'utf8');
}

/** Limits the UTF-8 size of a value once serialized to JSON. */
export function MaxJsonBytes(maxBytes: number, options?: ValidationOptions): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      name: 'maxJsonBytes',
      target: target.constructor,
      propertyName: String(propertyName),
      constraints: [maxBytes],
      options: {
        message: `$property must not exceed ${maxBytes} bytes when serialized as JSON`,
        ...options,
      },
      validator: { validate: (value: unknown) => jsonByteLength(value) <= maxBytes },
    });
  };
}
