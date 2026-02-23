import { PrismaClient } from '../../../generated/prisma';

export class DatabaseProvider {
        static instance: DatabaseProvider | null;
        private client: PrismaClient;
        private isConnected: boolean;

        private constructor() {
                this.client = new PrismaClient();
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
