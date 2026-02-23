import { PaymentProvider } from '../../../generated/prisma';
import { BinService } from './bin.service';

interface ProviderConfig {
        provider: PaymentProvider;
        priority: number;
        feeStructure: {
                percent: number;
                flat: number;
                cap?: number;
        };
}

export class DecisionEngine {
        private binService = new BinService();

        /**
         * MAIN LOGIC: Determines the best provider sequence
         */
        async getBestRoute(params: {
                amount: number;
                currency: string;
                cardBin?: string;
                merchantsProviders: ProviderConfig[];
        }): Promise<{ route: PaymentProvider[]; country: string }> {
                const { amount, cardBin, merchantsProviders } = params;

                // Identify Card Location (Geo-Routing)
                let cardCountry = 'UNKNOWN';
                if (cardBin) {
                        const binData = await this.binService.lookup(cardBin);
                        cardCountry = binData?.country || 'UNKNOWN';
                }

                //  Score and Sort Providers
                const sorted = merchantsProviders.sort((a, b) => {
                        // COST OPTIMIZATION (LCR)
                        const costA = this.calculateFee(amount, a.feeStructure);
                        const costB = this.calculateFee(amount, b.feeStructure);

                        // GEO-ROUTING OVERRIDE (High Priority)
                        //  If the card is Nigerian, we PREFER local providers (Paystack/FLW)
                        // even if Stripe is slightly cheaper, because success rates are higher.
                        const isLocalA = this.isLocalProvider(a.provider, cardCountry);
                        const isLocalB = this.isLocalProvider(b.provider, cardCountry);

                        if (isLocalA && !isLocalB) return -1; // Local goes first
                        if (!isLocalA && isLocalB) return 1;

                        // If both are local or both are international, pick cheaper (LCR)
                        return costA - costB;
                });

                return { route: sorted.map((p) => p.provider), country: cardCountry };
        }

        private calculateFee(amount: number, fee: any): number {
                let total = fee.flat + amount * (fee.percent / 100);
                if (fee.cap && total > fee.cap) total = fee.cap;
                return total;
        }

        private isLocalProvider(provider: PaymentProvider, country: string): boolean {
                const localMap: Record<string, PaymentProvider[]> = {
                        NG: [PaymentProvider.PAYSTACK, PaymentProvider.FLUTTERWAVE],
                        US: [PaymentProvider.STRIPE],
                        GB: [PaymentProvider.STRIPE]
                };
                return localMap[country]?.includes(provider) || false;
        }
}
