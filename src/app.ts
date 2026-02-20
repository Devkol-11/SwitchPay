import { fastify } from 'fastify';

export function createApp() {
        const app = fastify({
                logger: true
        });

        app.get('/health', async () => {
                return { status: 'ok' };
        });

        return app;
}
