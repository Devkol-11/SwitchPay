import { FastifyPluginCallback, FastifyError } from 'fastify';
import fp from 'fastify-plugin';
import { AppError } from '../utils/app.error';

const errorHandler: FastifyPluginCallback = (fastify, opts, done) => {
        fastify.setErrorHandler((error: FastifyError, request, reply) => {
                // Log the error using Fastify's built-in Pino logger
                // Note: Pino automatically includes the 'reqId' for tracing
                request.log.error(error);

                // Handle Schema Validation Errors (Fastify/Ajv built-in)
                if (error.validation) {
                        return reply.status(400).send({
                                status: 'error',
                                code: 'VALIDATION_ERROR',
                                message: 'Invalid input data',
                                details: error.validation.map((err) => ({
                                        field: err.instancePath || err.keyword,
                                        message: err.message
                                }))
                        });
                }

                //  Handle Our Custom App Errors
                if (error instanceof AppError) {
                        return reply.status(error.statusCode).send({
                                status: 'fail',
                                message: error.message
                        });
                }

                //  Handle Prisma Errors (Unique constraints, etc.)
                if ((error as any).code === 'P2002') {
                        return reply.status(409).send({
                                status: 'fail',
                                message: 'A record with this value already exists.'
                        });
                }

                // Catch-all for Generic / Internal Errors
                const isProduction = process.env.NODE_ENV === 'production';

                reply.status(500).send({
                        status: 'error',
                        message: isProduction ? 'Internal Server Error' : error.message,
                        // Only show stack trace in Development
                        ...(isProduction ? {} : { stack: error.stack })
                });
        });

        done();
};

export default fp(errorHandler);
