import { Flutterwave } from 'flutterwave-node-v3';
import {
        IPaymentProvider,
        CreatePaymentParams,
        ProviderResponse,
        WebhookResult
} from '../base/provider.interface';
import { PaymentProvider, PaymentStatus } from '../../../generated/prisma';

export class FlutterwaveProvider implements IPaymentProvider {
        readonly name = PaymentProvider.FLUTTERWAVE;
        private flw: any;

        constructor(secretKey: string, publicKey?: string) {
                this.flw = new Flutterwave(publicKey, secretKey);
        }

        async initializePayment(params: CreatePaymentParams): Promise<ProviderResponse> {
                try {
                        const response = await this.flw.Transaction.initialize({
                                amount: params.amount,
                                currency: params.currency,
                                tx_ref: params.reference, // Our internal ID
                                redirect_url: 'https://your-site.com/callback',
                                customer: {
                                        email: params.email
                                },
                                meta: params.metadata
                        });

                        if (response.status !== 'success') {
                                throw new Error(response.message);
                        }

                        return {
                                providerReference: response.data.link, // Flutterwave uses link as ref for init
                                status: PaymentStatus.PENDING,
                                rawResponse: response.data,
                                redirectUrl: response.data.link
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
                // Flutterwave verification uses their internal transaction ID
                const response = await this.flw.Transaction.verify({ id: providerReference });

                return {
                        providerReference: response.data.id.toString(),
                        status: this.mapStatus(response.data.status),
                        rawResponse: response.data
                };
        }

        private mapStatus(status: string): PaymentStatus {
                switch (status) {
                        case 'successful':
                                return PaymentStatus.SUCCEEDED;
                        case 'failed':
                                return PaymentStatus.FAILED;
                        default:
                                return PaymentStatus.PENDING;
                }
        }

        async verifyWebhook(payload: any, signature: string, secret: string): Promise<WebhookResult> {
                // Flutterwave sends a secret hash in the 'verif-hash' header
                // We compare it to the one we set in their dashboard
                const internalSecretHash = process.env.FLW_WEBHOOK_SECRET_HASH;

                if (signature !== internalSecretHash) {
                        throw new Error('Invalid Webhook Signature');
                }

                return {
                        paymentId: payload.data.tx_ref,
                        status:
                                payload.data.status === 'successful'
                                        ? PaymentStatus.SUCCEEDED
                                        : PaymentStatus.FAILED,
                        rawResponse: payload.data
                };
        }
}
