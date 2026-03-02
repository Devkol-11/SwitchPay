import { Queue } from 'bullmq';
import { IEvent } from './events.base';
import { redisClient } from '../infra/client/redis.js';

export class BullMQDispatcher {
        private queue: Queue;

        constructor(queueName: string = 'app-events') {
                this.queue = new Queue(queueName, {
                        connection: redisClient,
                        defaultJobOptions: {
                                attempts: 5, // Retry 5 times if it fails
                                backoff: {
                                        type: 'exponential',
                                        delay: 1000 // Wait 1s, then 2s, 4s...
                                },
                                removeOnComplete: true // Keep Redis clean
                        }
                });
        }

        async dispatch(event: IEvent): Promise<void> {
                this.queue.add(event.eventName, event.getPayload());
                console.log(`[Queued]: ${event.eventName}`);
        }
}

export const eventQueue = new BullMQDispatcher();
