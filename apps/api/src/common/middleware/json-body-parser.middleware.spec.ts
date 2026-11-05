import {
  BadRequestException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { toBodyParserException } from './json-body-parser.middleware.js';

function parserError(type: string, status: number): Error {
  return Object.assign(new SyntaxError('Unexpected token } in JSON at position 9'), {
    type,
    status,
  });
}

describe('toBodyParserException', () => {
  it.each([
    ['entity.parse.failed', 400, BadRequestException, 'Malformed JSON request body'],
    ['entity.too.large', 413, PayloadTooLargeException, 'Request body is too large'],
    ['encoding.unsupported', 415, UnsupportedMediaTypeException, 'Unsupported request encoding'],
  ])('maps %s to a %i with a client-safe message', (type, status, exceptionType, message) => {
    const exception = toBodyParserException(parserError(type, status));

    expect(exception).toBeInstanceOf(exceptionType);
    expect((exception as BadRequestException).message).toBe(message);
    expect((exception as BadRequestException).getStatus()).toBe(status);
  });

  it('passes through errors it does not recognise', () => {
    const other = new Error('something else');

    expect(toBodyParserException(other)).toBe(other);
    expect(toBodyParserException(parserError('stream.not.readable', 500))).toBeInstanceOf(
      SyntaxError,
    );
  });
});
