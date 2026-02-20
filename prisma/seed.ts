import { dbClient } from '../src/infrastructure/database/prisma';

async function main() {
        const apiKey = 'seed_api_key';

        const merchant = await dbClient.merchant.create({
                data: {
                        name: 'Test Merchant',
                        apiKeyHash: apiKey
                }
        });

        console.log('Merchant created:', merchant);
        console.log('Seeding completed.');
}

main().catch((err) => {
        console.error('Error seeding database:', err);
        process.exit(1);
});
