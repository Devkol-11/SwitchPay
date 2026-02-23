import { PaymentStatus } from '../../../generated/prisma';
import { ProviderFactory } from '../../providers/provider.factory';
import { decrypt } from '../../utils/encryption';
import { dbClient } from '../../infra/database/prisma';

export class ReconciliationService {
        /**
         * Finds and fixes payments stuck in PENDING status
         */
        async reconcileStuckPayments() {
                const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

                //  Find all PENDING payments that haven't been updated in 15 mins
                const stuckPayments = await dbClient.payment.findMany({
                        where: {
                                status: PaymentStatus.PENDING,
                                updatedAt: { lt: fifteenMinutesAgo }
                        },
                        include: {
                                attempts: {
                                        orderBy: { createdAt: 'desc' },
                                        take: 1 // Get the most recent attempt
                                },
                                merchant: {
                                        include: { merchantProviders: true }
                                }
                        }
                });

                console.log(`[RECON--SERVICE] Found ${stuckPayments.length} stuck payments.`);

                for (const payment of stuckPayments) {
                        await this.processSingleReconciliation(payment);
                }
        }

        private async processSingleReconciliation(payment: any) {
                const latestAttempt = payment.attempts[0];

                // If there's no attempt, the user likely closed the window before redirect.
                // We mark it as FAILED after some time.
                if (!latestAttempt || !latestAttempt.providerRef) {
                        await dbClient.payment.update({
                                where: { id: payment.id },
                                data: { status: PaymentStatus.FAILED }
                        });
                        return;
                }

                try {
                        // Setup Provider
                        const config = payment.merchant.merchantProviders.find(
                                (p: any) => p.provider === latestAttempt.provider
                        );

                        const secretKey = decrypt(config.encryptedApiKey);
                        const provider = ProviderFactory.getProvider(latestAttempt.provider, secretKey);

                        // Manually call the Provider's Verification API
                        console.log(
                                `[RECON--SERVICE] Verifying ${payment.id} via ${latestAttempt.provider}...`
                        );
                        const result = await provider.verifyPayment(latestAttempt.providerRef);

                        // Update if the status has changed
                        if (result.status !== PaymentStatus.PENDING) {
                                await dbClient.$transaction([
                                        dbClient.paymentAttempt.update({
                                                where: { id: latestAttempt.id },
                                                data: { status: result.status }
                                        }),
                                        dbClient.payment.update({
                                                where: { id: payment.id },
                                                data: { status: result.status }
                                        })
                                ]);
                                console.log(
                                        `[RECON--SERVICE] Successfully updated ${payment.id} to ${result.status}`
                                );
                        }
                } catch (error) {
                        console.error(`[RECON--SERVICE] Failed to reconcile ${payment.id}:`, error);
                }
        }
}
