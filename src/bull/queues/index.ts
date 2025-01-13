import { Queue } from "bullmq";
import { redisConfig } from "../../config/database.config";

//---  initialize queues ---//

// Donation request queue
export const donationRequestQueue = new Queue('donationRequestsQueue', { connection: redisConfig });

// Mail queue
export const mailQueue = new Queue('mailQueue', { connection: redisConfig });

// SMS queue
export const smsQueue = new Queue('smsQueue', { connection: redisConfig });

// reports queue
export const reportQueue = new Queue('reportGenerationQueue', { connection: redisConfig });



// export function createWorker(queueName: string, processor: (job: Job) => Promise<void>) {
//     return new Worker(queueName, processor, { connection: redisConfig });
// }

// export async function addJobToQueue(queue: Queue, data: any) {
//     await queue.add('process', data);
// }
