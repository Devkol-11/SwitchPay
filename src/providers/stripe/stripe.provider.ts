import Stripe from 'stripe';
import { PaymentProvider, PaymentStatus } from '../../../generated/prisma';
import {
        CreatePaymentParams,
        IPaymentProvider,
        ProviderResponse,
        WebhookVerificationResult
} from '../base/provider.interface';

export class StripeProvider implements IPaymentProvider {
        readonly name: PaymentProvider = PaymentProvider.STRIPE;
        private stripe: Stripe;

        constructor() {
                this.stripe = new Stripe('', {
                        apiVersion: `2026-01-28.clover`
                });
        }

        async initializePayment(params: CreatePaymentParams): Promise<ProviderResponse> {
                try {
                        const initialSession = await this.stripe.paymentIntents.create({
                                amount: params.amount,
                                currency: params.currency.toLocaleLowerCase(),
                                metadata: { ...params.metadata, internal_reference: params.reference },
                                payment_method_types: ['card']
                        });

                        return {
                                providerReference: initialSession.id,
                                status: this.mapStatus(initialSession.status),
                                rawResponse: initialSession
                        };
                } catch (error: any) {
                        return {
                                providerReference: error.requestId || 'FAILED',
                                status: PaymentStatus.FAILED,
                                rawResponse: error
                        };
                }
        }

        async verifyPayment(providerReference: string): Promise<ProviderResponse> {
                const paymentIntent = await this.stripe.paymentIntents.retrieve(providerReference);
                return {
                        providerReference: paymentIntent.id,
                        status: this.mapStatus(paymentIntent.status),
                        rawResponse: paymentIntent
                };
        }

        private mapStatus(stripeStatus: string): PaymentStatus {
                switch (stripeStatus) {
                        case 'succeeded':
                                return PaymentStatus.SUCCEEDED;
                        case 'processing':
                                return PaymentStatus.PROCESSING;
                        case 'requires_payment_method':
                        case 'canceled':
                                return PaymentStatus.FAILED;
                        default:
                                return PaymentStatus.PENDING;
                }
        }

        async handleWebhook(payload: any, signature: string): Promise<WebhookVerificationResult> {}
}
