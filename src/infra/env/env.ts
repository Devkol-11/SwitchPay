import dotenv from 'dotenv';

interface Config {
        PORT: number;
        DATABASE_URL: string;
        REDIS_URL: string;
        NODE_ENV: string;
        JWT_SECRET: string;
        DATABASE_URL_UNPOOLED: string;
}

const result = dotenv.config();
if (result.error) {
        throw new Error('FAILED TO LOAD ENVIRONMENT VARIABLES...');
}
export const config: Config = {
        PORT: process.env.PORT,
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        NODE_ENV: process.env.NODE_ENV,
        REDIS_URL: process.env.REDIS_URL,
        DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED
};
