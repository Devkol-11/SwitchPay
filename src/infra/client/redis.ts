import Redis from 'ioredis';
import { config } from '../env/env.js';

export class RedisProvider {
        private static instance: RedisProvider;
        private client: Redis;
        private isConnected: boolean = false;

        private constructor() {
                this.client = new Redis(config.REDIS_URL);
        }

        public static getInstance(): RedisProvider {
                if (RedisProvider.instance == null) {
                        return (RedisProvider.instance = new RedisProvider());
                }
                return RedisProvider.instance;
        }

        public getClient(): Redis {
                return this.client;
        }

        public async connect() {
                if (this.isConnected) return;
                console.log('CONNECTING TO REDIS....');
                await this.client.connect();
                this.isConnected = true;
                console.log('REDIS CONNECTED SUCCESSFULLY');
        }

        public disconnect() {
                if (!this.isConnected) return;
                console.log('DISCONNECTING REDIS....');
                this.client.disconnect();
                console.log('REDIS DISOCNNECTED SUCCESSFULLY');
        }
}

export const redisProvider = RedisProvider.getInstance();
export const redisClient = redisProvider.getClient();
