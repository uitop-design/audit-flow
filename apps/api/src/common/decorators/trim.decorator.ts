import { Transform } from 'class-transformer';

/** Trims string input before validation; other values pass through unchanged. */
export function Trim(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );
}
