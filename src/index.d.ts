export {};

declare global {
        namespace NodeJS {
                interface ProcessEnv {
                        PORT: number;
                        NODE_ENV: string;
                        DATABASE_URL: string;
                        DATABASE_URL_UNPOOLED: string;
                        REDIS_URL: string;
                        JWT_SECRET: string;
                }
        }
}
