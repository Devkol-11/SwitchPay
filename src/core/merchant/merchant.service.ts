import { randomBytes } from 'node:crypto';
import { MerchantRepo } from './merchant.repo';
import { MerchantUtils } from './merchant.utils';
import { ApiMode } from '../../../generated/prisma';
import { UnauthorizedError, ConflictError, InvalidTokenError, TokenReuseError } from './merchant.errors';

export class MerchantService {
        /**
         * REGISTER: Create Merchant + Setup Webhook Secret
         */
        static async registerMerchant(params: { name: string; email: string; password: string }) {
                if (await MerchantRepo.existsByEmail(params.email)) {
                        throw new ConflictError('A merchant with this email already exists');
                }

                const hashedPassword = await MerchantUtils.hashPassword(params.password);
                const webhookSecret = MerchantUtils.generateWebhookSecret();

                const merchant = await MerchantRepo.createMerchant({
                        name: params.name,
                        email: params.email,
                        passwordHash: hashedPassword,
                        webhookSecret,
                        isVerified: false
                });

                // [EVENT: EMIT_WELCOME_EMAIL] - Trigger welcome flow here

                return { id: merchant.id, email: merchant.email };
        }

        /**
         * LOGIN: Verify + Issue Refresh Token
         */
        static async login(email: string, pass: string) {
                const merchant = await MerchantRepo.findByEmail(email);
                if (!merchant) throw new UnauthorizedError('Invalid email or password');

                const isValid = await MerchantUtils.comparePassword(pass, merchant.passwordHash);
                if (!isValid) throw new UnauthorizedError('Invalid email or password');

                const refreshToken = randomBytes(40).toString('hex');
                const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days

                await MerchantRepo.createRefreshToken(merchant.id, refreshToken, expiresAt);

                return { merchantId: merchant.id, refreshToken };
        }

        /**
         * TOKEN ROTATION:
         */
        static async rotateSession(oldRefreshToken: string) {
                const storedToken = await MerchantRepo.findRefreshToken(oldRefreshToken);

                if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
                        throw new InvalidTokenError();
                }

                // REPLAY ATTACK DETECTION
                if (storedToken.isUsed) {
                        await MerchantRepo.revokeAllMerchantSessions(storedToken.userId);
                        // [EVENT: EMIT_SECURITY_ALERT_EMAIL]
                        throw new TokenReuseError();
                }

                await MerchantRepo.markTokenAsUsed(storedToken.id);

                const newToken = randomBytes(40).toString('hex');
                const nextExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                await MerchantRepo.createRefreshToken(storedToken.userId, newToken, nextExpiry);

                return { refreshToken: newToken };
        }

        /**
         * API KEY GENERATION: One-time raw key reveal
         */
        static async generateNewApiKey(merchantId: string, mode: ApiMode, keyName: string) {
                const rawKey = MerchantUtils.generateRawApiKey(mode.toLowerCase() as any);
                const hashedKey = MerchantUtils.hashKey(rawKey);

                await MerchantRepo.saveApiKey(merchantId, hashedKey, mode, keyName);

                return { rawKey }; // Return this only ONCE to the frontend
        }

        /**
         * PASSWORD RESET FLOW
         */
        static async forgotPassword(email: string) {
                const merchant = await MerchantRepo.findByEmail(email);
                if (!merchant) return; // Silent return for security (don't reveal if email exists)

                // [EVENT: EMIT_PASSWORD_RESET_EMAIL] - Generate a short lived token and email it
        }

        static async resetPassword(merchantId: string, newPass: string) {
                const hash = await MerchantUtils.hashPassword(newPass);
                await MerchantRepo.updatePassword(merchantId, hash);
                await MerchantRepo.revokeAllMerchantSessions(merchantId); // Security best practice
        }
}
