import { ZodObject, ZodError } from 'zod';
import { FastifyRequest, FastifyReply } from 'fastify';

export function validateZodSchema(schema: ZodObject<any>) {
        return async (request: FastifyRequest, reply: FastifyReply) => {
                try {
                        await schema.parseAsync(request.body);
                } catch (error) {
                        if (error instanceof ZodError) {
                                const errors = error.issues.map((err) => ({
                                        field: err.path.join('.'),
                                        message: err.message
                                }));

                                return reply.status(400).send({
                                        status: 'error',
                                        message: 'Validation failed',
                                        errors
                                });
                        }

                        return reply.status(500).send({
                                message: 'Internal Server Error'
                        });
                }
        };
}
