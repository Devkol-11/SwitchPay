import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { eventQueue, BullMQDispatcher } from '../utils/queue.dispatcher';

declare module 'fastify' {
        interface FastifyInstance {
                events: BullMQDispatcher;
        }
}

const eventsPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
        fastify.decorate('events', eventQueue);
};

export default fp(eventsPlugin);
