import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

async function clearQueue() {
    const connection = new Redis();
    const queue = new Queue('seo-missions', { connection });
    await queue.obliterate({ force: true });
    console.log("Redis queue cleared!");
    process.exit(0);
}

clearQueue();
