import { z } from 'zod';

/**
 * REGISTRATION SCHEMA
 */
export const RegisterMerchantSchema = z.object({
        name: z.string().min(2, { error: 'Name must be at least 2 characters' }),
        email: z.email({ error: 'Invalid email format' }),
        password: z.string().min(8, { error: 'Password must be at least 8 characters' })
});

/**
 * LOGIN SCHEMA
 */
export const LoginMerchantSchema = z.object({
        email: z.email({ error: 'Invalid email format' }),
        password: z.string().min(1, { error: 'Password is required' })
});

/**
 * API KEY GENERATION SCHEMA
 */
const API_MODES = ['LIVE', 'TEST'] as const;

export const GenerateApiKeySchema = z.object({
        name: z.string().min(1, { error: 'Key name is required' }),
        mode: z.enum(API_MODES, {
                error: (issue) => {
                        if (issue.code === 'invalid_value') {
                                return "Mode must be either 'LIVE' or 'TEST'";
                        }
                        if (issue.input === undefined) {
                                return 'Mode is required';
                        }
                        return 'Invalid selection';
                }
        })
});

// Type inference
export type RegisterMerchantInput = z.infer<typeof RegisterMerchantSchema>;
export type LoginMerchantInput = z.infer<typeof LoginMerchantSchema>;
export type GenerateApiKeyInput = z.infer<typeof GenerateApiKeySchema>;
