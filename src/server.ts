import { createApp } from './app';
import fastifyEnv from '@fastify/env';

interface AppConfig {
        PORT: string;
        DATABASE_URL: string;
}

declare module 'fastify' {
        interface FastifyInstance {
                config: AppConfig;
        }
}

async function main() {
        const app = createApp();

        const schema = {
                type: 'object',
                required: ['PORT', 'DATABASE_URL'],
                properties: {
                        PORT: { type: 'string', default: '3000' },
                        DATABASE_URL: { type: 'string' }
                }
        };

        const options = {
                confKey: 'config',
                schema: schema,
                dotenv: true
        };

        try {
                await app.register(fastifyEnv, options);

                console.log('✅ Environment Loaded');
                console.log('Database URL:', app.config.DATABASE_URL);

                const port = Number(app.config.PORT);

                await app.listen({
                        port: port,
                        host: '0.0.0.0'
                });
        } catch (err) {
                console.error('❌ Startup Error:', err);
                process.exit(1);
        }
}

main();
