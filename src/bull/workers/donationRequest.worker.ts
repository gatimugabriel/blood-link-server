// This worker listens to the donationRequestsQueue and processes donation requests by sending notifications to nearby donors
import {Job, Worker} from 'bullmq';
import {DonationRequestService} from '../../application/services/donationRequestService';
import {NotificationService} from '../../application/services/notificationService';
import {DonationRepository} from '../../infrastructure/repositories/donationRepository';
import {redisConfig} from '../../config/database';
import {DB} from '../../infrastructure/database/data-source';
import {UserRepository} from '../../infrastructure/repositories/userRepository';
import {UserService} from '../../application/services/userService';

const donationRepository = new DonationRepository();
const userRepository = new UserRepository();

const donationRequestService = new DonationRequestService(donationRepository, userRepository);
const userService = new UserService(userRepository);

const notificationService = new NotificationService();

//@function Process donation request
async function processDonationRequest(job: Job) {
    const donationRequest = job.data;
    // console.log(`Donation Request Data in job: ${job.name},  jobID: ${job.id}`, donationRequest);
    const {requestData} = donationRequest
    
    try {
        // Ensure DB is initialized before processing jobs
        if (!DB.isInitialized) {
            await DB.initialize();
        }

        const nearbyDonors = await donationRequestService.getNearbyDonors(
            requestData.requestLocation.latitude,
            requestData.requestLocation.longitude,
            50000, // 50km radius
            requestData.bloodGroup,
            requestData.userId
        );

        const messageData = {
            title: 'New Donation Request!',
            subTitle: 'You have a new donation request nearby, save a life!',
            bloodGroup: requestData.bloodGroup,
            location: {
                latitude: requestData.requestLocation.latitude,
                longitude: requestData.requestLocation.longitude,
            },
            urgency: requestData.urgency
        }

        await notificationService.sendNotification(nearbyDonors, messageData);
    } catch (error) {
        console.error(`Error processing donation request ${donationRequest.id}:`, error);
        throw error; // BullMQ will handle retries
    }
}

// Create worker to process donation requests
export const donationRequestWorker = new Worker('donationRequestsQueue', processDonationRequest, {connection: redisConfig});

donationRequestWorker.on('completed', job => console.log(`Donation-Request Job No. ${job.id} completed`));
donationRequestWorker.on('failed', (job, err) => console.error(`Donation-Request Job No. ${job?.id} failed with error ${err}`));
donationRequestWorker.on('error', (err) => {
    console.error('Donation Request worker error:', err)
})

console.log('Donation request worker started');
