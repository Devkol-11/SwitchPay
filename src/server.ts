import { createApp } from './app';
import { config } from './infra/env/env.js';
import { databaseProvider } from './infra/database/prisma.js';
import { redisProvider } from './infra/client/redis.js';

async function main() {
        try {
                const app = createApp();

                console.log('DB_URL: ', config.DATABASE_URL);
                console.log('JWT_SECRET : ', config.JWT_SECRET);
                console.log('DB_URL_UNPOOLED : ', config.DATABASE_URL_UNPOOLED);

                await databaseProvider.connectDB();
                // await redisProvider.connect();

                await app.listen({
                        port: config.PORT,
                        host: '0.0.0.0'
                });

                console.log('SERVER RUNNING ON : ', config.PORT);
        } catch (err) {
                console.error('Startup Error:', err);
                process.exit(1);
        }
}

main();
