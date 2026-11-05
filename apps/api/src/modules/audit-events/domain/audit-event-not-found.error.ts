import { NotFoundError } from '../../../common/errors/not-found.error.js';

export class AuditEventNotFoundError extends NotFoundError {
  constructor(readonly auditEventId: string) {
    super(`Audit event ${auditEventId} not found`);
  }
}
