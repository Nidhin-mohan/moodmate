// Base class stays — it's still useful when you need a one-off error.
// But the subclasses below cover the common cases, so service code
// becomes self-documenting: "throw new NotFoundError(...)" vs
// "throw new CustomError(..., 404)".

export default class CustomError extends Error {
  statusCode: number;
  errorCode?: string;

  constructor(message: string, statusCode: number, errorCode?: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 400 — client sent something invalid that Zod didn't catch
// (e.g., a valid format but bad business logic like end date before start date)
export class BadRequestError extends CustomError {
  constructor(message: string) {
    super(message, 400, "BAD_REQUEST");
  }
}

// 401 — not authenticated (no token, bad token, expired)
export class UnauthorizedError extends CustomError {
  constructor(message = "Not authorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

// 404 — resource doesn't exist
// Takes the resource name and ID so the message is consistent everywhere:
// "Mood log not found: 507f1f77bcf86cd799439011"
export class NotFoundError extends CustomError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} not found: ${id}` : `${resource} not found`;
    super(message, 404, "NOT_FOUND");
  }
}

// 409 — trying to create something that already exists
export class ConflictError extends CustomError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}
