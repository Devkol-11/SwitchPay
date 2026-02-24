import { fastify } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import errorHandler from './plugins/error-handler';
import merchantRoutes from './api/routes/merchant.routes';

export function createApp() {
        const app = fastify({ logger: true });

        app.register(errorHandler);
        app.register(fastifyCookie);

        app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
                try {
                        const json = JSON.parse(body.toString());
                        done(null, { raw: body, parsed: json });
                } catch (err) {
                        done(err as Error, undefined);
                }
        });

        app.get('/health', async () => ({ status: 'ok' }));
        app.register(merchantRoutes, { prefix: 'api/v1/merchants' });

        return app;
}
