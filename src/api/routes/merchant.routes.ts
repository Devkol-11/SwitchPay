import { FastifyInstance } from 'fastify';
import { ApiMode } from '../../../generated/prisma';
import { MerchantService } from '../../core/merchant/merchant.service';
import {
        RegisterMerchantSchema,
        RegisterMerchantInput,
        LoginMerchantSchema,
        LoginMerchantInput,
        GenerateApiKeySchema,
        GenerateApiKeyInput
} from '../schemas/merchant.schemas';
import { HTTP_STATUS } from '../../utils/http.statusCodes';
import { authenticateMerchant } from '../../hooks/auth.hook';

export default async function merchantRoutes(fastify: FastifyInstance) {
        fastify.post(
                '/register',
                {
                        schema: {
                                body: RegisterMerchantSchema
                        }
                },
                async (request, reply) => {
                        const { name, email, password } = request.body as RegisterMerchantInput;
                        const result = await MerchantService.registerMerchant({ name, email, password });
                        return reply.code(HTTP_STATUS.CREATED).send(result);
                }
        );

        fastify.post(
                '/login',
                {
                        schema: {
                                body: LoginMerchantSchema
                        }
                },
                async (request, reply) => {
                        const { email, password } = request.body as LoginMerchantInput;
                        const result = await MerchantService.login(email, password);

                        // Set Refresh Token in a secure cookie
                        reply.setCookie('refreshToken', result.refreshToken, {
                                httpOnly: true,
                                secure: true,
                                path: '/v1/merchants/refresh'
                        });

                        return { merchantId: result.merchantId };
                }
        );

        fastify.post(
                '/keys',
                {
                        schema: {
                                body: GenerateApiKeySchema
                        },
                        preHandler: [authenticateMerchant]
                },
                async (request, reply) => {
                        const id = request.merchant.id;
                        const { mode, name } = request.body as GenerateApiKeyInput;

                        const result = await MerchantService.generateNewApiKey(id, mode as ApiMode, name);
                        return reply.code(HTTP_STATUS.CREATED).send(result);
                }
        );
}
