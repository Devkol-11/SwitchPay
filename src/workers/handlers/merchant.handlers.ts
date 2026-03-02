import { Job } from 'bullmq';

export const merchantHandlers = {
        'merchant.registered': async (job: Job) => {
                const { email, name } = job.data;
                console.log(`[Worker] Sending welcome email to ${email}`);
        },
        'merchant.api_key.created': async (job: Job) => {
                console.log(`[Worker] Auditing new API key for ${job.data.merchantId}`);
        }
};
