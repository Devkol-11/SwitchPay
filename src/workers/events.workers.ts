import { Worker, Job } from 'bullmq';
import { merchantHandlers } from './handlers/merchant.handlers.js';
import { redisClient } from '../infra/client/redis.js';

const handlerRegistry: Record<string, (job: Job) => Promise<void>> = {
        ...merchantHandlers
};

export const startEventWorker = () => {
        new Worker(
                'app-events',
                async (job: Job) => {
                        const handler = handlerRegistry[job.name]; // job.name is the eventName

                        if (!handler) {
                                console.warn(`[Worker] No handler found for event: ${job.name}`);
                                return;
                        }

                        await handler(job);
                },
                {
                        connection: redisClient,
                        concurrency: 5 // Process 5 events at once
                }
        );
};
