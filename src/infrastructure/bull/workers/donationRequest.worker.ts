// This worker listens to the donationRequestsQueue and processes donation requests by sending notifications to nearby donors
import { Job, Worker } from 'bullmq';
import { DonationRequestService } from '../../../application/services/donationRequestService';
import { NotificationService } from '../../../application/services/notificationService';
import { UserService } from '../../../application/services/userService';
import { redisConfig } from '../../../application/config/database.config';
import { DB } from '../../database/data-source';
import { DonationRepository } from '../../../domain/repositories/donationRepository';
import { UserRepository } from '../../../domain/repositories/userRepository';
import { Notification } from '../../../domain/entity/Notification';

const donationRepository = new DonationRepository();
const userRepository = new UserRepository();

const donationRequestService = new DonationRequestService(donationRepository, userRepository);
const userService = new UserService(userRepository);

const notificationService = new NotificationService();

//@function Process donation request
async function processDonationRequest(job: Job) {
    const donationRequest = job.data;
    // console.log(`Donation Request Data in job: ${job.name},  jobID: ${job.id}`, donationRequest);
    const { requestData } = donationRequest
    
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
            requestId: requestData.requestID,
            body: {
                bloodGroup: requestData.bloodGroup,
                location: {
                    latitude: requestData.requestLocation.latitude,
                    longitude: requestData.requestLocation.longitude,
                },
                urgency: requestData.urgency,
                requestId: requestData.requestID
            }
        }

        await notificationService.sendNotification(nearbyDonors, messageData);

        // Save notifications to database for each donor
        const notificationRepository = DB.getRepository(Notification);
        const notificationPromises = nearbyDonors.map(async (donor) => {
            const notification = new Notification();
            notification.userID = donor.id;
            notification.content = `New ${requestData.bloodGroup} blood donation request nearby - ${requestData.urgency} urgency`;
            notification.status = 'sent';
            notification.requestID = requestData.requestID;
            notification.bloodGroup = requestData.bloodGroup;
            notification.urgency = requestData.urgency;
            notification.latitude = requestData.requestLocation.latitude;
            notification.longitude = requestData.requestLocation.longitude;
            return notificationRepository.save(notification);
        });
        
        await Promise.all(notificationPromises);
        console.log(`Saved ${nearbyDonors.length} notifications to database`);
    } catch (error) {
        console.error(`Error processing donation request ${donationRequest.id}:`, error);
        throw error;
    }
}

// Create worker to process donation requests
export const donationRequestWorker = new Worker('donationRequestsQueue', processDonationRequest, { connection: redisConfig });

donationRequestWorker.on('completed', job => console.log(`Donation-Request Job No. ${job.id} completed`));
donationRequestWorker.on('failed', (job, err) => console.error(`Donation-Request Job No. ${job?.id} failed with error ${err}`));
donationRequestWorker.on('error', (err) => {
    console.error('Donation Request worker error:', err)
})

console.log('Donation request worker started');
