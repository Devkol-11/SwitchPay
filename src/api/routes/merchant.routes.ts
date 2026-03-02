import { FastifyInstance } from 'fastify';
import { ApiMode } from '../../../generated/prisma';
import { MerchantService } from '../../core/merchant/merchant.service.js';
import { validateZodSchema } from '../schemas/zod.validate';
import {
        RegisterMerchantSchema,
        RegisterMerchantInput,
        LoginMerchantSchema,
        LoginMerchantInput,
        GenerateApiKeySchema,
        GenerateApiKeyInput,
        ForgotPasswordSchema,
        ForgotPasswordInput
} from '../schemas/merchant.schemas.js';
import { HTTP_STATUS } from '../../utils/http.statusCodes.js';
import { authenticateMerchant } from '../../hooks/auth.hook.js';

export default async function merchantRoutes(fastify: FastifyInstance) {
        fastify.post(
                '/register',
                {
                        preHandler: [
                                async (request) => {
                                        request.log.info({ body: request.body }, '[ : INCOMING REQUEST]');
                                },
                                validateZodSchema(RegisterMerchantSchema)
                        ]
                },
                async (request, reply) => {
                        const { name, email, password } = request.body as RegisterMerchantInput;
                        const result = await MerchantService.registerMerchant({ name, email, password });
                        reply.setCookie('refreshToken', result.refreshToken, {
                                httpOnly: true,
                                secure: true,
                                path: 'api/v1/merchants/refresh'
                        });
                        return reply.code(HTTP_STATUS.CREATED).send(result);
                }
        );

        fastify.post(
                '/login',
                {
                        preHandler: [validateZodSchema(LoginMerchantSchema)]
                },
                async (request, reply) => {
                        const { email, password } = request.body as LoginMerchantInput;
                        const result = await MerchantService.login(email, password);
                        reply.setCookie('refreshToken', result.refreshToken, {
                                httpOnly: true,
                                secure: true,
                                path: 'api/v1/merchants/refresh'
                        });

                        return { merchantId: result.merchantId };
                }
        );

        fastify.post(
                '/keys',
                {
                        preHandler: [validateZodSchema(GenerateApiKeySchema), authenticateMerchant]
                },
                async (request, reply) => {
                        const id = request.merchant.id;
                        const { mode, name } = request.body as GenerateApiKeyInput;

                        const result = await MerchantService.generateNewApiKey(id, mode as ApiMode, name);
                        return reply.code(HTTP_STATUS.CREATED).send(result);
                }
        );

        fastify.post(
                '/forgot-password',
                {
                        preHandler: [validateZodSchema(ForgotPasswordSchema)]
                },
                async (request, reply) => {
                        const { email } = request.body as ForgotPasswordInput;
                        const result = await MerchantService.forgotPassword(email);
                        return reply.code(HTTP_STATUS.OK).send(result);
                }
        );

        // fastify.post('reset-password', { preHandler: [validateZodSchema()] });
}
