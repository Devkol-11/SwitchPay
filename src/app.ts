import { fastify } from 'fastify';
import { PaymentOrchestrator } from './core/orchestrator/payment.orchestrator';
import { WebhookHandler } from './core/webhooks/webhook.handler';

const orchestrator = new PaymentOrchestrator();
const webhookHandler = new WebhookHandler();

export function createApp() {
        const app = fastify({
                logger: true
        });

        app.get('/health', async () => {
                return { status: 'ok' };
        });

        // This allows us to access the raw body for Webhook verification
        // Stripe and Paystack need the unmodified string to check signatures.
        app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
                try {
                        const newBody = {
                                raw: body, // Keep the buffer
                                parsed: JSON.parse(body.toString()) // Also provide the object
                        };
                        done(null, newBody);
                } catch (err) {
                        done(err as Error, undefined);
                }
        });

        /**
         * INITIATE PAYMENT
         */
        app.post('/v1/payments/initiate', async (request, reply) => {
                const { amount, currency, email, cardBin, merchantId, idempotencyKey } = (request.body as any)
                        .parsed;

                try {
                        const result = await orchestrator.processPayment({
                                merchantId,
                                amount,
                                currency,
                                email,
                                idempotencyKey,
                                cardBin
                        });

                        return reply.code(201).send(result);
                } catch (error: any) {
                        return reply.code(400).send({ error: error.message });
                }
        });

        /**
         * UNIVERSAL WEBHOOK ENDPOINT
         */
        app.post('/v1/webhooks/:provider', async (request, reply) => {
                const { provider } = request.params as { provider: string };
                const signature =
                        request.headers['x-paystack-signature'] ||
                        request.headers['stripe-signature'] ||
                        request.headers['verif-hash'];

                try {
                        // We pass the RAW buffer for Stripe, or the parsed JSON for others
                        const body = (request.body as any).raw;
                        const result = await webhookHandler.handle(
                                provider.toUpperCase(),
                                body,
                                signature as string
                        );

                        return reply.code(200).send(result);
                } catch (error: any) {
                        app.log.error(error);
                        return reply.code(400).send({ error: 'Webhook verification failed' });
                }
        });

        /**
         * CHECK STATUS (POLLING)
         */
        app.get('/v1/payments/:id', async (request, reply) => {
                const { id } = request.params as { id: string };
                // Direct DB lookup for the frontend to check if a payment is done
                const payment = await prisma.payment.findUnique({ where: { id } });
                return reply.send(payment);
        });

        return app;
}
