import type { PaymentStatus, PaymentProvider } from '../../../generated/prisma';

// What the Orchestrator sends TO a provider
export interface CreatePaymentParams {
        amount: number; // In lowest denomination (kobo/cents)
        currency: string; // ISO code (USD, NGN, etc.)
        email: string;
        reference: string; // internal PaymentAttempt ID
        metadata?: Record<string, any>;
}

// What a provider MUST return back to us
export interface ProviderResponse {
        providerReference: string; // The ID given by Stripe/Paystack
        status: PaymentStatus;
        rawResponse: any; // For audit logging
        redirectUrl?: string; // For hosted checkout pages
}

// Normalized Webhook Result
export interface WebhookVerificationResult {
        isValid: boolean;
        providerReference: string;
        status: PaymentStatus;
        amount?: number;
}

export interface IPaymentProvider {
        /**
         * The name of the provider (STRIPE, PAYSTACK)
         */
        readonly name: PaymentProvider;

        /**
         * Initiates a transaction with the external gateway
         */
        initializePayment(params: CreatePaymentParams): Promise<ProviderResponse>;

        /**
         * Manually verify a payment status (Critical for Auto-Reconciliation)
         */
        verifyPayment(providerReference: string): Promise<ProviderResponse>;

        /**
         * Handle incoming webhooks and map them to internal statuses
         */
        handleWebhook(payload: any, signature: string): Promise<WebhookVerificationResult>;
}
