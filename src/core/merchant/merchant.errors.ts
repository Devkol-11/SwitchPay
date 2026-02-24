import { AppError } from '../../utils/app.error';
import { HTTP_STATUS } from '../../utils/http.statusCodes';

export class UnauthorizedError extends AppError {
        constructor(message = 'Unauthorized access') {
                super(message, HTTP_STATUS.UNAUTHORIZED);
        }
}

export class NotFoundError extends AppError {
        constructor(message = 'Resource not found') {
                super(message, HTTP_STATUS.NOT_FOUND);
        }
}

export class ConflictError extends AppError {
        constructor(message = 'Resource already exists') {
                super(message, HTTP_STATUS.CONFLICT);
        }
}

export class TokenReuseError extends AppError {
        constructor(message = 'Security Alert: Token reuse detected') {
                super(message, HTTP_STATUS.FORBIDDEN);
        }
}

export class InvalidTokenError extends AppError {
        constructor(message = 'Session expired or invalid') {
                super(message, HTTP_STATUS.UNAUTHORIZED);
        }
}
