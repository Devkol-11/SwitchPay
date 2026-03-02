import { PrismaClient } from '../../../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from '../env/env';
export class DatabaseProvider {
        static instance: DatabaseProvider | null;
        private client: PrismaClient;
        private adapter: PrismaPg;
        private isConnected: boolean;

        private constructor() {
                const connectionString = config.DATABASE_URL;
                console.log('DB CONNECTION STRING : ', connectionString);
                if (!connectionString) {
                        throw new Error('DATABASE URL IS NOT DEFINED');
                }
                this.adapter = new PrismaPg({ connectionString });
                this.client = new PrismaClient({ adapter: this.adapter });
                this.isConnected = false;
        }

        static getInstance(): DatabaseProvider {
                if (!DatabaseProvider.instance) {
                        DatabaseProvider.instance = new DatabaseProvider();
                        return DatabaseProvider.instance;
                }
                return DatabaseProvider.instance;
        }

        public getClient(): PrismaClient {
                return this.client;
        }

        public async connectDB() {
                try {
                        if (this.isConnected) return;
                        console.log('CONNECTING TO THE DATABASE.....');
                        await this.client.$connect();
                        this.isConnected = true;
                        console.log('DATABASE CONNECTED SUCCESSFULLY');
                } catch (error) {
                        console.error('FAILED TO CONNECT TO THE DATABASE');
                        process.exit(1);
                }
        }

        public async disconnectDB() {
                try {
                        if (!this.isConnected) return;
                        console.log('DISCONNECTING FROM THE DATABASE...');
                        await this.client.$disconnect();
                        console.log('DATABASE SUCCESSFULLY DISCONNECTED');
                } catch (error) {
                        console.error('FAILED TO DISCONNECT FROM THE DATABASE');
                        process.exit(1);
                }
        }
}

export const databaseProvider = DatabaseProvider.getInstance();
export const dbClient = databaseProvider.getClient();
