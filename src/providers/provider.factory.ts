import { PaymentProvider } from '../../generated/prisma';
import { IPaymentProvider } from './base/provider.interface';
import { StripeProvider } from './international/stripe/stripe.provider';
import { PaystackProvider } from './local/paystack/transfer/paystack.provider';
import { FlutterwaveProvider } from './local/flutterwave/transfer/flutterwave.provider';

export class ProviderFactory {
        static getProvider(type: PaymentProvider, secretKey: string, publicKey?: string): IPaymentProvider {
                switch (type) {
                        case PaymentProvider.STRIPE:
                                return new StripeProvider(secretKey);
                        case PaymentProvider.PAYSTACK:
                                return new PaystackProvider(secretKey);
                        case PaymentProvider.FLUTTERWAVE:
                                return new FlutterwaveProvider(secretKey, publicKey);
                        default:
                                throw new Error('Unsupported provider');
                }
        }
}
