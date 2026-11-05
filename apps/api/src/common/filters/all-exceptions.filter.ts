import { type ArgumentsHost, Catch, type ExceptionFilter, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { requestPath } from '../http/request-path.js';
import { toErrorResponse } from './error-response.js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionsHandler');

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const { status, body, unexpected } = toErrorResponse(exception, {
      method: req.method,
      originalUrl: req.originalUrl,
      path: requestPath(req),
      requestId: req.requestId,
      timestamp: new Date(),
    });

    if (unexpected) {
      const stack = exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(`Unhandled error requestId=${req.requestId}`, stack);
    }

    if (!res.headersSent) {
      res.status(status).json(body);
    }
  }
}
