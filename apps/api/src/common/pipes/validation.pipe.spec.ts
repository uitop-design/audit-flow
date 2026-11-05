import type { ArgumentMetadata } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsString, Min, ValidateNested } from 'class-validator';
import { createValidationPipe, RequestValidationException } from './validation.pipe.js';

class AddressDto {
  @IsString()
  city!: string;
}

class PersonDto {
  @IsEmail()
  email!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  age!: number;

  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;
}

const metadata: ArgumentMetadata = { type: 'body', metatype: PersonDto };

async function validationIssues(value: unknown) {
  try {
    await createValidationPipe().transform(value, metadata);
  } catch (error) {
    if (error instanceof RequestValidationException) {
      return error.issues;
    }
    throw error;
  }
  throw new Error('Expected validation to fail');
}

describe('createValidationPipe', () => {
  it('transforms a valid payload into the DTO class', async () => {
    const result = await createValidationPipe().transform(
      { email: 'ada@example.com', age: '36', address: { city: 'London' } },
      metadata,
    );

    expect(result).toBeInstanceOf(PersonDto);
    expect(result).toEqual({ email: 'ada@example.com', age: 36, address: { city: 'London' } });
  });

  it('reports nested errors with dotted field paths', async () => {
    const issues = await validationIssues({
      email: 'ada@example.com',
      age: 1,
      address: { city: 7 },
    });

    expect(issues).toEqual([{ field: 'address.city', message: 'city must be a string' }]);
  });

  it('reports every failing field, not just the first', async () => {
    const issues = await validationIssues({ email: 'nope', age: 0, address: { city: 'Kyiv' } });

    expect(issues.map((issue) => issue.field)).toEqual(['email', 'age']);
  });

  it('rejects properties that are not declared on the DTO', async () => {
    const issues = await validationIssues({
      email: 'ada@example.com',
      age: 1,
      address: { city: 'Kyiv' },
      createdAt: '2020-01-01T00:00:00Z',
    });

    expect(issues).toEqual([
      { field: 'createdAt', message: 'property createdAt should not exist' },
    ]);
  });
});
