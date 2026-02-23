import { ProviderFactory } from '../../providers/provider.factory';
import { decrypt } from '../../utils/encryption';
import { dbClient } from '../../infra/database/prisma';

export class WebhookHandler {
        async handle(providerName: string, payload: any, signature: string) {
                // 1. Find the attempt to identify the merchant
                // Most providers send our reference (attemptId) in the payload
                const attemptId = this.extractAttemptId(providerName, payload);

                const attempt = await dbClient.paymentAttempt.findUnique({
                        where: { id: attemptId },
                        include: {
                                payment: { include: { merchant: { include: { merchantProviders: true } } } }
                        }
                });

                if (!attempt) throw new Error('Payment attempt not found for this webhook');

                // 2. Get the provider's config & decrypt the secret
                const config = attempt.payment.merchant.merchantProviders.find(
                        (p) => p.provider === providerName
                );
                const secretKey = decrypt(config!.encryptedApiKey);

                // 3. Ask the Provider to verify the signature (Security!)
                const provider = ProviderFactory.getProvider(config!.provider, secretKey);
                const result = await provider.verifyWebhook(payload, signature, secretKey);

                // 4. Update the Database (The State Machine)
                await dbClient.$transaction([
                        dbClient.paymentAttempt.update({
                                where: { id: attempt.id },
                                data: { status: result.status }
                        }),
                        dbClient.payment.update({
                                where: { id: attempt.paymentId },
                                data: { status: result.status, provider: config!.provider }
                        })
                ]);

                return { received: true };
        }

        private extractAttemptId(provider: string, payload: any): string {
                // Every provider hides our reference in a different place
                if (provider === 'PAYSTACK') return payload.data.reference;
                if (provider === 'STRIPE') return payload.data.object.metadata.attemptId;
                if (provider === 'FLUTTERWAVE') return payload.data.tx_ref;
                throw new Error('Unknown provider');
        }
}
