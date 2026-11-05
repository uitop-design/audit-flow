/**
 * Framework-independent "resource does not exist" error. Domain code throws subclasses;
 * the global exception filter maps them to HTTP 404.
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
