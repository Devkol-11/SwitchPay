import Fastify from 'fastify';
import fastifyEnv from '@fastify/env';

const app = Fastify({
        logger: true
});

const schema = {
        type: 'object',
        required: ['PORT'],
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

app.register(fastifyEnv, options).ready((err) => {
        if (err) {
                app.log.error(err);
                process.exit(1);
        }
});

app.get('/health', async () => {
        return { paymentRouterServer: 'UP AND RUNNING' };
});

const start = async () => {
        try {
                await app.listen({ port: 4000 });
                console.log(process.env.DATABASE_URL ?? 'DATABASE_URL is not set');
        } catch (err) {
                app.log.error(err);
                process.exit(1);
        }
};

start();
