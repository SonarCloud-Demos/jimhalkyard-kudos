export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

const HTTP_BAD_REQUEST = 400;

export class ValidationError extends AppError {
  constructor(message: string) {
    super(HTTP_BAD_REQUEST, message);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

const HTTP_STATUS_UNAUTHORIZED = 401;

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(HTTP_STATUS_UNAUTHORIZED, message);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

const HTTP_STATUS_FORBIDDEN = 403;

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(HTTP_STATUS_FORBIDDEN, message);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

const HTTP_STATUS_NOT_FOUND = 404;

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(HTTP_STATUS_NOT_FOUND, message);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

const HTTP_STATUS_CONFLICT = 409;

export class ConflictError extends AppError {
  constructor(message: string) {
    super(HTTP_STATUS_CONFLICT, message);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}
