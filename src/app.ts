import { fastify } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import errorHandler from './plugins/error-handler.js';
import merchantRoutes from './api/routes/merchant.routes.js';

export function createApp() {
        const app = fastify({ logger: true });
        const baseUrl = '/api/v1/';

        console.log();

        app.register(errorHandler);
        app.register(fastifyCookie);

        app.get('/health', async () => ({ status: 'ok' }));
        app.register(merchantRoutes, { prefix: `${baseUrl}merchants` });

        return app;
}
