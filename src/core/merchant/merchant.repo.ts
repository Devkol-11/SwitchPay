import { dbClient } from '../../infra/database/prisma.js';
import { ApiMode, PaymentProvider } from '../../../generated/prisma';

export class MerchantRepo {
        static async existsByEmail(email: string) {
                const count = await dbClient.merchant.count({ where: { email } });
                return count > 0;
        }

        static async findByEmail(email: string) {
                return await dbClient.merchant.findUnique({ where: { email } });
        }

        static async findById(id: string) {
                return await dbClient.merchant.findUnique({ where: { id }, include: { apiKeys: true } });
        }

        static async createMerchant(data: any) {
                return await dbClient.merchant.create({ data });
        }

        static async updatePassword(id: string, hash: string) {
                return await dbClient.merchant.update({ where: { id }, data: { passwordHash: hash } });
        }

        // --- API KEY METHODS ---
        static async saveApiKey(data: {
                merchantId: string;
                hash: string;
                mode: ApiMode;
                name: string;
                keyPreview: string;
        }) {
                return await dbClient.apiKey.create({
                        data: {
                                merchantId: data.merchantId,
                                keyHash: data.hash,
                                mode: data.mode,
                                name: data.name,
                                keyPreview: data.keyPreview
                        }
                });
        }

        // --- REFRESH TOKEN / SESSION METHODS ---
        static async createRefreshToken(data: { merchantId: string; token: string; expiresAt: Date }) {
                return await dbClient.refreshToken.create({
                        data: { userId: data.merchantId, token: data.token, expiresAt: data.expiresAt }
                });
        }

        static async findRefreshToken(token: string) {
                return await dbClient.refreshToken.findUnique({
                        where: { token },
                        include: { merchant: true }
                });
        }

        static async markTokenAsUsed(id: string) {
                return await dbClient.refreshToken.update({ where: { id }, data: { isUsed: true } });
        }

        static async saveResetToken(data: { merchantId: string; tokenHash: string; expiresAt: Date }) {
                return await dbClient.passwordResetToken.create({
                        data: {
                                merchantId: data.merchantId,
                                tokenHash: data.tokenHash,
                                expiresAt: data.expiresAt,
                                used: false
                        }
                });
        }

        static async getResetToken(merchantId: string, tokenHash: string) {
                return await dbClient.passwordResetToken.findUnique({
                        where: {
                                merchantId,
                                tokenHash
                        }
                });
        }

        static async deleteAllResetTokens(merchantId: string) {
                return await dbClient.passwordResetToken.deleteMany({ where: { merchantId } });
        }

        static async deleteResetToken(data: { merchantId: string; tokenHash: string }) {
                return await dbClient.passwordResetToken.delete({
                        where: { merchantId: data.merchantId, tokenHash: data.tokenHash }
                });
        }

        static async revokeAllMerchantSessions(merchantId: string) {
                return await dbClient.refreshToken.updateMany({
                        where: { userId: merchantId },
                        data: { isRevoked: true }
                });
        }

        static async registerPaymentProvider(params: {
                merchantId: string;
                providerName: PaymentProvider;
                secureApiKey: string;
                priorityLevel: number;
        }) {
                return await dbClient.merchantProvider.create({
                        data: {
                                merchantId: params.merchantId,
                                provider: params.providerName,
                                encryptedApiKey: params.secureApiKey,
                                priority: params.priorityLevel
                        }
                });
        }

        static async toogleMerchantProvider(params: {
                providerId: string;
                merchantId: string;
                providerName: PaymentProvider;
                state: boolean;
        }) {
                return await dbClient.merchantProvider.update({
                        where: {
                                id: params.providerId,
                                merchantId: params.merchantId,
                                provider: params.providerName
                        },
                        data: {
                                enabled: params.state ? true : false
                        }
                });
        }
}
