import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';

export class MerchantUtils {
        private static readonly SALT_ROUNDS = 12;

        static async hashPassword(password: string): Promise<string> {
                return bcrypt.hash(password, this.SALT_ROUNDS);
        }

        static async comparePassword(password: string, hash: string): Promise<boolean> {
                return bcrypt.compare(password, hash);
        }

        /**
         * Generates a "Show Once" API Key
         * Format: sp_[live/test]_[random_string]
         */
        static generateRawApiKey(mode: 'live' | 'test' = 'live'): string {
                const bytes = randomBytes(32).toString('hex');
                return `sp_${mode}_${bytes}`;
        }

        /**
         * Hashes an API Key for DB storage (SHA-256)
         */
        static hashKey(rawKey: string): string {
                return createHash('sha256').update(rawKey).digest('hex');
        }

        static generateWebhookSecret(): string {
                return `whsec_${randomBytes(24).toString('hex')}`;
        }
}
