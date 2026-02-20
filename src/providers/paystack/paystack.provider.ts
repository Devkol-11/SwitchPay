import Paystack from '@efobi/paystack';
import { IPaymentProvider, CreatePaymentParams, ProviderResponse } from '../base/provider.interface';
import { PaymentProvider, PaymentStatus } from '../../../generated/prisma';

export class PaystackProvider implements IPaymentProvider {
        readonly name = PaymentProvider.PAYSTACK;
        private paystack: any;

        constructor() {
                // Note: Use your Secret Key from .env
                this.paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY!);
        }

        async initializePayment(params: CreatePaymentParams): Promise<ProviderResponse> {
                try {
                        const response = await this.paystack.transaction.initialize({
                                amount: params.amount, // Already in kobo/cents from orchestrator
                                email: params.email,
                                reference: params.reference,
                                currency: params.currency,
                                metadata: params.metadata
                        });

                        return {
                                providerReference: response.data.reference,
                                status: PaymentStatus.PENDING, // Initialized is always pending
                                rawResponse: response,
                                redirectUrl: response.data.authorization_url
                        };
                } catch (error: any) {
                        return {
                                providerReference: 'FAILED',
                                status: PaymentStatus.FAILED,
                                rawResponse: error
                        };
                }
        }

        async verifyPayment(providerReference: string): Promise<ProviderResponse> {
                try {
                        const response = await this.paystack.transaction.verify(providerReference);
                        return {
                                providerReference: response.data.reference,
                                status: this.mapStatus(response.data.status),
                                rawResponse: response.data
                        };
                } catch (error) {
                        return {
                                providerReference,
                                status: PaymentStatus.FAILED,
                                rawResponse: error
                        };
                }
        }

        private mapStatus(paystackStatus: string): PaymentStatus {
                switch (paystackStatus) {
                        case 'success':
                                return PaymentStatus.SUCCEEDED;
                        case 'failed':
                                return PaymentStatus.FAILED;
                        case 'reversed':
                                return PaymentStatus.FAILED;
                        case 'processing':
                                return PaymentStatus.PROCESSING;
                        default:
                                return PaymentStatus.PENDING;
                }
        }

        async handleWebhook() {
                throw new Error('Phase 4 Feature');
        }
}
