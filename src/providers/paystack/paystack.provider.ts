import { Paystack } from '@efobi/paystack';
import {
        IPaymentProvider,
        CreatePaymentParams,
        ProviderResponse,
        WebhookResult
} from '../base/provider.interface';
import { PaymentProvider, PaymentStatus } from '../../../generated/prisma';
import crypto from 'node:crypto';

export class PaystackProvider implements IPaymentProvider {
        readonly name = PaymentProvider.PAYSTACK;
        private paystack: Paystack;

        constructor(secretKey: string) {
                this.paystack = new Paystack(secretKey);
        }

        async initializePayment(params: CreatePaymentParams): Promise<ProviderResponse> {
                try {
                        const response = await this.paystack.transaction.initialize({
                                amount: String(params.amount),
                                email: params.email,
                                reference: params.reference,
                                currency: params.currency,
                                metadata: params.metadata
                        });

                        if (!response) {
                                throw new Error('Failed to initialize payments');
                        }

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

        async verifyWebhook(payload: any, signature: string, secret: string): Promise<WebhookResult> {
                //  Verify Signature
                const hash = crypto
                        .createHmac('sha512', secret)
                        .update(JSON.stringify(payload))
                        .digest('hex');

                if (hash !== signature) {
                        throw new Error('Invalid Paystack Signature');
                }

                // Map Paystack Event to our Status
                const event = payload.event;
                let status: PaymentStatus;

                if (event === 'paymentrequest.pending') {
                        status = PaymentStatus.PENDING;
                }
                if (event === 'paymentrequest.success') {
                        status = PaymentStatus.SUCCEEDED;
                }
                status = PaymentStatus.PENDING;

                return {
                        paymentId: payload.data.reference, // This is the attempt.id we sent
                        status: status,
                        rawResponse: payload.data
                };
        }
}
