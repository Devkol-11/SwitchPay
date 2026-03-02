import { FastifyReply, FastifyRequest } from 'fastify';
import { UnauthorizedError } from '../core/merchant/merchant.errors.js';
import { config } from '../infra/env/env.js';

import jwt from 'jsonwebtoken';

declare module 'fastify' {
        interface FastifyRequest {
                merchant: {
                        id: string;
                        email: string;
                };
        }
}

export async function authenticateMerchant(request: FastifyRequest, _reply: FastifyReply) {
        try {
                const authHeader = request.headers.authorization;
                if (!authHeader?.startsWith('Bearer ')) {
                        throw new UnauthorizedError('Missing or invalid token');
                }

                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
                        id: string;
                        email: string;
                        role: string;
                };

                request.merchant = {
                        id: decoded.id,
                        email: decoded.email
                };
        } catch (err) {
                throw new UnauthorizedError('Session expired or invalid');
        }
}
