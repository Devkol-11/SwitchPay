import { dbClient } from '../../infra/database/prisma';
import { ApiMode } from '../../../generated/prisma';

export class MerchantRepo {
        static async existsByEmail(email: string) {
                const count = await dbClient.merchant.count({ where: { email } });
                return count > 0;
        }

        static async findByEmail(email: string) {
                return dbClient.merchant.findUnique({ where: { email } });
        }

        static async findById(id: string) {
                return dbClient.merchant.findUnique({ where: { id }, include: { apiKeys: true } });
        }

        static async createMerchant(data: any) {
                return dbClient.merchant.create({ data });
        }

        static async updatePassword(id: string, hash: string) {
                return dbClient.merchant.update({ where: { id }, data: { passwordHash: hash } });
        }

        // --- API KEY METHODS ---
        static async saveApiKey(merchantId: string, hash: string, mode: ApiMode, name: string) {
                return dbClient.apiKey.create({
                        data: { merchantId, keyHash: hash, mode, name }
                });
        }

        // --- REFRESH TOKEN / SESSION METHODS ---
        static async createRefreshToken(merchantId: string, token: string, expiresAt: Date) {
                return dbClient.refreshToken.create({
                        data: { userId: merchantId, token, expiresAt }
                });
        }

        static async findRefreshToken(token: string) {
                return dbClient.refreshToken.findUnique({
                        where: { token },
                        include: { merchant: true }
                });
        }

        static async markTokenAsUsed(id: string) {
                return dbClient.refreshToken.update({ where: { id }, data: { isUsed: true } });
        }

        static async revokeAllMerchantSessions(merchantId: string) {
                return dbClient.refreshToken.updateMany({
                        where: { userId: merchantId },
                        data: { isRevoked: true }
                });
        }
}
