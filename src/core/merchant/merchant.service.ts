import { randomBytes } from 'node:crypto';
import { MerchantRepo } from './merchant.repo.js';
import { MerchantUtils } from './merchant.utils.js';
import { ApiMode, PaymentProvider } from '../../../generated/prisma';
import {
        UnauthorizedError,
        ConflictError,
        InvalidTokenError,
        TokenReuseError,
        NotFoundError
} from './merchant.errors.js';
import { MerchantRegisteredEvent, ForgotPasswordEvent } from './merchant.events.js';

export class MerchantService {
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

                const accessToken = MerchantUtils.generateAccessToken({
                        id: merchant.id,
                        email: merchant.email,
                        role: merchant.role
                });

                const { refreshToken, expiresAt } = MerchantUtils.generateRefreshTokenWithExpiry();

                await MerchantRepo.createRefreshToken({
                        merchantId: merchant.id,
                        token: refreshToken,
                        expiresAt
                });

                const event = new MerchantRegisteredEvent({
                        merchantId: merchant.id,
                        merchantEmail: merchant.email
                });

                // [EVENT: EMIT_WELCOME_EMAIL] - Trigger welcome flow here

                return {
                        id: merchant.id,
                        email: merchant.email,
                        accessToken: accessToken,
                        refreshToken: refreshToken
                };
        }

        static async login(email: string, pass: string) {
                const merchant = await MerchantRepo.findByEmail(email);
                if (!merchant) throw new UnauthorizedError('Invalid email or password');

                const isValid = await MerchantUtils.comparePassword(pass, merchant.passwordHash);
                if (!isValid) throw new UnauthorizedError('Invalid email or password');

                const accessToken = MerchantUtils.generateAccessToken({
                        id: merchant.id,
                        email: merchant.email,
                        role: merchant.role
                });

                const { refreshToken, expiresAt } = MerchantUtils.generateRefreshTokenWithExpiry();

                await MerchantRepo.createRefreshToken({
                        merchantId: merchant.id,
                        token: refreshToken,
                        expiresAt
                });

                return { merchantId: merchant.id, accessToken: accessToken, refreshToken: refreshToken };
        }

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
                await MerchantRepo.createRefreshToken({
                        merchantId: storedToken.userId,
                        token: newToken,
                        expiresAt: nextExpiry
                });

                return { refreshToken: newToken };
        }

        /**
         * API KEY GENERATION: One-time raw key reveal
         */
        static async generateNewApiKey(merchantId: string, mode: ApiMode, keyName: string) {
                const rawKey = MerchantUtils.generateRawApiKey(mode.toLowerCase() as any);
                const hashedKey = MerchantUtils.hashKey(rawKey);

                await MerchantRepo.saveApiKey({
                        merchantId: merchantId,
                        hash: hashedKey,
                        mode: mode,
                        name: keyName,
                        keyPreview: '' /// <- FIX THIS
                });

                return { rawKey };
        }

        /**
         * PASSWORD RESET FLOW
         */
        static async forgotPassword(email: string) {
                const merchant = await MerchantRepo.findByEmail(email);
                if (!merchant) return;

                await MerchantRepo.deleteAllResetTokens(merchant.id);

                const { otp, expiresAt } = MerchantUtils.generateSecureOtp();

                const tokenHash = MerchantUtils.hashKey(otp);

                await MerchantRepo.saveResetToken({ merchantId: merchant.id, tokenHash, expiresAt });

                const event = new ForgotPasswordEvent({
                        merchantId: merchant.id,
                        merchantEmail: merchant.email,
                        resetOtp: otp
                });

                // [EVENT: EMIT_PASSWORD_RESET_EMAIL] - Generate a short lived token and email it

                return {
                        message: 'Check your email for an OTP to reset your password'
                };
        }

        static async resetPassword(data: {
                merchantEmail: string;
                incomingToken: string;
                newPassword: string;
        }) {
                const merchant = await MerchantRepo.findByEmail(data.merchantEmail);

                if (!merchant) {
                        throw new NotFoundError('Invalid credentials');
                }

                const tokenHash = MerchantUtils.hashKey(data.incomingToken);

                const savedToken = await MerchantRepo.getResetToken(merchant.id, tokenHash);

                if (!savedToken) {
                        throw new UnauthorizedError('Invalid or expired token');
                }

                const now = new Date();

                if (now > savedToken.expiresAt) {
                        throw new UnauthorizedError('Token expired');
                }

                const newPasswordHash = await MerchantUtils.hashPassword(data.newPassword);

                await MerchantRepo.updatePassword(merchant.id, newPasswordHash);

                await MerchantRepo.deleteResetToken({ merchantId: merchant.id, tokenHash: tokenHash });
        }

        static async registerMerchantProvider(data: {
                merchantId: string;
                providerName: PaymentProvider;
                secureApiKey: string;
                priorityLevel: number;
        }) {
                const merchant = await MerchantRepo.findById(data.merchantId);

                if (!merchant) {
                        throw new UnauthorizedError('Merchant not found');
                }

                await MerchantRepo.registerPaymentProvider({
                        merchantId: merchant.id,
                        providerName: data.providerName,
                        secureApiKey: data.secureApiKey,
                        priorityLevel: data.priorityLevel
                });

                return { message: 'Success !' };
        }

        static async toogleMerchantProvider(data: {
                providerId: string;
                merchantId: string;
                providerName: PaymentProvider;
                state: boolean;
        }) {
                const merchant = await MerchantRepo.findById(data.merchantId);
                if (!merchant) {
                        throw new UnauthorizedError('Merchant not found');
                }

                await MerchantRepo.toogleMerchantProvider({
                        providerId: data.providerId,
                        merchantId: data.merchantId,
                        providerName: data.providerName,
                        state: data.state
                });

                return { message: 'Success !' };
        }
}
