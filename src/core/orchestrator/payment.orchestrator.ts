import { PaymentStatus, PaymentProvider } from '../../../generated/prisma';
import { DecisionEngine } from '../routing/decision.engine';
import { ProviderFactory } from '../../providers/provider.factory';
import { decrypt } from '../../utils/encryption';
import { dbClient } from '../../infra/database/prisma';

export class PaymentOrchestrator {
        private decisionEngine = new DecisionEngine();

        async processPayment(params: {
                merchantId: string;
                amount: number;
                currency: string;
                email: string;
                idempotencyKey: string;
                cardBin?: string;
        }) {
                // Check Idempotency
                const existingPayment = await dbClient.payment.findUnique({
                        where: {
                                merchantId_idempotencyKey: {
                                        merchantId: params.merchantId,
                                        idempotencyKey: params.idempotencyKey
                                }
                        },
                        include: { attempts: true }
                });

                if (existingPayment) return existingPayment;

                //  Get Merchant Providers & Decrypt Keys
                const merchantProviders = await dbClient.merchantProvider.findMany({
                        where: { merchantId: params.merchantId, enabled: true }
                });

                // Get the Smart Route from the Decision Brain
                const { route, country } = await this.decisionEngine.getBestRoute({
                        amount: params.amount,
                        currency: params.currency,
                        cardBin: params.cardBin,
                        merchantsProviders: merchantProviders.map((p) => ({
                                provider: p.provider,
                                priority: p.priority,
                                feeStructure: p.feeStructure as any
                        }))
                });

                // Create the Master Payment Record
                const payment = await dbClient.payment.create({
                        data: {
                                merchantId: params.merchantId,
                                amount: params.amount,
                                currency: params.currency,
                                idempotencyKey: params.idempotencyKey,
                                status: PaymentStatus.PENDING,
                                cardBin: params.cardBin || 'UNKNOWN', // --- TO BE CORRECTED
                                cardCountry: country
                        }
                });

                // CASCADING LOOP (The Core Logic)
                for (const providerType of route) {
                        const attempt = await this.createAttempt(payment.id, providerType);

                        try {
                                // Get provider instance and decrypt the merchant's key for this specific call
                                const config = merchantProviders.find((p) => p.provider === providerType);

                                if (!config) {
                                        console.error(
                                                `Provider ${providerType} config missing for merchant ${params.merchantId}`
                                        );
                                        continue; // Skip to the next provider in the route
                                }
                                const secretKey = decrypt(config!.encryptedApiKey); 

                                let publicKey: string | undefined = config.encryptedPublicKey
                                        ? decrypt(config.encryptedPublicKey)
                                        : undefined;

                                const provider = ProviderFactory.getProvider(
                                        providerType,
                                        secretKey,
                                        publicKey
                                );

                                const result = await provider.initializePayment({
                                        amount: params.amount,
                                        currency: params.currency,
                                        email: params.email,
                                        reference: attempt.id // Use Attempt ID as the reference for tracking
                                });

                                // Update Attempt with Provider Response
                                await dbClient.paymentAttempt.update({
                                        where: { id: attempt.id },
                                        data: {
                                                providerRef: result.providerReference,
                                                status: result.status
                                        }
                                });

                                // If successful or redirecting, stop the cascade and return
                                if (result.status === PaymentStatus.SUCCEEDED || result.redirectUrl) {
                                        await dbClient.payment.update({
                                                where: { id: payment.id },
                                                data: { status: result.status, provider: providerType }
                                        });

                                        return { paymentId: payment.id, ...result };
                                }

                                // If we reach here, this specific provider failed. The loop continues to the next.
                        } catch (error: any) {
                                await dbClient.paymentAttempt.update({
                                        where: { id: attempt.id },
                                        data: {
                                                status: PaymentStatus.FAILED,
                                                errorMessage: error.message
                                        }
                                });
                                // Continue to fallback...
                        }
                }

                // If all providers in the route failed
                await dbClient.payment.update({
                        where: { id: payment.id },
                        data: { status: PaymentStatus.FAILED }
                });

                throw new Error('Payment failed across all available providers.');
        }

        private async createAttempt(paymentId: string, provider: PaymentProvider) {
                return dbClient.paymentAttempt.create({
                        data: {
                                paymentId,
                                provider,
                                status: PaymentStatus.PENDING
                        }
                });
        }
}
