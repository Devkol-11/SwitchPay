import { PaymentProvider } from '../../generated/prisma';
import { IPaymentProvider } from './base/provider.interface';
import { StripeProvider } from './stripe/stripe.provider';
import { PaystackProvider } from './paystack/paystack.provider';

export class ProviderFactory {
        private static providers: Map<PaymentProvider, IPaymentProvider> = new Map();

        static getProvier(name: PaymentProvider): IPaymentProvider {
                if (!this.providers.has(name)) {
                        switch (name) {
                                case PaymentProvider.STRIPE:
                                        this.providers.set(name, new StripeProvider());
                                        break;

                                case PaymentProvider.PAYSTACK:
                                        this.providers.set(name, new PaystackProvider());
                                        break;
                                default:
                                        throw new Error(`PROVIDER FOR ${name} NOT SET`);
                        }
                }
                return this.providers.get(name)!;
        }
}
