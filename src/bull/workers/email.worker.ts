import { Worker, Job } from 'bullmq';
import { NotificationService } from '../../application/services/notificationService';
import { redisConfig } from '../../config/database.config';

const notificationService = new NotificationService();

//@function Process notifications
async function processNotifications(job: Job) {
    const notificationRequest = job.data;
    console.log(`Notification Request Data in job: ${job.name},  jobID: ${job.id}`, notificationRequest);

    try {
        const { recipient, message } = job.data;

        // Send SMS & email notifications
        await notificationService.sendNotification(recipient, message);

    } catch (error) {
        console.error(`Error sending notifcation ${notificationRequest.id}:`, error);
        throw error; // Rethrow to let BullMQ handle retries
    }
}

// Create worker to process notifications
export const emailWorker = new Worker('mailQueue', processNotifications, { connection: redisConfig });

emailWorker.on('completed', job => console.log(`Donation-Request Job ${job.id} completed`));
emailWorker.on('failed', (job, err) => console.error(`Donation-Request Job ${job?.id} failed with error ${err}`));
emailWorker.on('error', (err) => { console.error('Donation Request worker error:', err) })

console.log('Notification worker started');
