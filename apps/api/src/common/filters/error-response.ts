import { STATUS_CODES } from 'node:http';
import { HttpException, HttpStatus } from '@nestjs/common';
import { RequestValidationException, type ValidationIssue } from '../pipes/validation.pipe.js';

export interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string;
  details?: ValidationIssue[];
  path: string;
  requestId: string;
  timestamp: string;
}

export interface ErrorContext {
  method: string;
  /** Full request URL including the query string, as received. */
  originalUrl: string;
  /** Request path without the query string; the only form echoed back to clients. */
  path: string;
  requestId: string;
  timestamp: Date;
}

export interface ErrorResponse {
  status: number;
  body: ErrorResponseBody;
  /** True when the error was not an expected HTTP error and must be logged with its stack. */
  unexpected: boolean;
}

/**
 * Maps any thrown value to the API's uniform error body. Internal details (stack traces,
 * database errors) never reach the response.
 */
export function toErrorResponse(exception: unknown, context: ErrorContext): ErrorResponse {
  if (exception instanceof RequestValidationException) {
    return build(HttpStatus.BAD_REQUEST, 'Request validation failed', context, exception.issues);
  }
  if (exception instanceof HttpException) {
    return build(exception.getStatus(), httpExceptionMessage(exception, context), context);
  }
  return {
    ...build(HttpStatus.INTERNAL_SERVER_ERROR, 'Internal server error', context),
    unexpected: true,
  };
}

function build(
  status: number,
  message: string,
  context: ErrorContext,
  details?: readonly ValidationIssue[],
): ErrorResponse {
  return {
    status,
    unexpected: false,
    body: {
      statusCode: status,
      error: STATUS_CODES[status] ?? 'Error',
      message,
      ...(details ? { details: [...details] } : {}),
      path: context.path,
      requestId: context.requestId,
      timestamp: context.timestamp.toISOString(),
    },
  };
}

function httpExceptionMessage(exception: HttpException, context: ErrorContext): string {
  // Nest's unknown-route message echoes the full URL; drop the query string, which may hold
  // personal data such as search terms or emails.
  if (exception.message === `Cannot ${context.method} ${context.originalUrl}`) {
    return `Cannot ${context.method} ${context.path}`;
  }
  const response = exception.getResponse();
  if (typeof response === 'string') {
    return response;
  }
  if (typeof response === 'object' && response !== null && 'message' in response) {
    const { message } = response;
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(message)) {
      return message.join('; ');
    }
  }
  return exception.message;
}
