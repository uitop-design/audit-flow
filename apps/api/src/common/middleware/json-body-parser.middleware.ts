import {
  BadRequestException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import express, {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from 'express';

/**
 * Translates `body-parser` failures into HTTP exceptions with stable, client-safe messages.
 * Without this, Nest forwards the raw parser text (e.g. "Unexpected token } in JSON at position 9").
 */
export function toBodyParserException(error: unknown): unknown {
  if (typeof error !== 'object' || error === null || !('type' in error)) {
    return error;
  }
  switch (error.type) {
    case 'entity.parse.failed':
      return new BadRequestException('Malformed JSON request body', { cause: error });
    case 'entity.too.large':
      return new PayloadTooLargeException('Request body is too large', { cause: error });
    case 'charset.unsupported':
    case 'encoding.unsupported':
      return new UnsupportedMediaTypeException('Unsupported request encoding', { cause: error });
    default:
      return error;
  }
}

export function createJsonBodyParser(limit: string): RequestHandler {
  const parse = express.json({ limit });
  return (req: Request, res: Response, next: NextFunction) => {
    parse(req, res, (error?: unknown) =>
      next(error === undefined ? undefined : toBodyParserException(error)),
    );
  };
}
