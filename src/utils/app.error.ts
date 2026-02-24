export class AppError extends Error {
        public readonly statusCode: number;
        public readonly isOperational: boolean;

        constructor(message: string, statusCode: number = 400) {
                super(message);
                this.statusCode = statusCode;
                this.isOperational = true; // We know why this happened

                Error.captureStackTrace(this, this.constructor);
        }
}
