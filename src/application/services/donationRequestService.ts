import {donationRequestQueue} from "../../infrastructure/bull/queues";
import {DonationRequest} from "../../domain/entity/DonationRequest";
import {User} from "../../domain/entity/User";
import {DonationRepository} from "../../domain/repositories/donationRepository";
import {createPoint} from "../../utils/database";
import {CreateDonationRequestDto} from "../dtos/donationRequestDto";
import {BloodType} from "../../domain/value-objects/bloodType";
import {UserRepository} from "../../domain/repositories/userRepository";
import {Donation} from "../../domain/entity/Donation";

export class DonationRequestService {
    constructor(
        private donationRepository: DonationRepository,
        private userRepo: UserRepository
    ) {
    }

    // --- create a new donation request --- //
    async createNewDonationRequest(data: CreateDonationRequestDto): Promise<DonationRequest> {
        let requestLocationPoint
        let dataToSave
        let jobData: {
            bloodGroup: BloodType,
            requestID: string,
            requestLocation: { latitude: number, longitude: number },
            urgency: string,
            userId: string // requester ID
        }

        requestLocationPoint = createPoint(data.requestLocation.latitude, data.requestLocation.longitude)

        if (data.requestingFor !== "" && data.requestingFor === "other") {
            console.log("saving for others")
            dataToSave = {
                ...data,
                requestLocation: requestLocationPoint,
                user: data.userId,
                requestFor: data.requestingFor
            }
        } else {
            console.log("saving for self")
            // Check if the user has any open requests for themselves
            const existingRequests: DonationRequest[] = await this.donationRepository.findOpenRequestsByUser(data.userId);
            const hasOpenSelfRequest = existingRequests.some(item =>
                item && item.requestFor === "self"
            );
            if (hasOpenSelfRequest) {
                throw new Error("You already have an open donation request for yourself. Please hang tight as we reach more donors / request for another user");
            }

            const user = await this.userRepo.findUser({where: {id: data.userId}});
            if (!user) {
                throw new Error("User not found");
            }

            dataToSave = {
                ...data,
                requestLocation: requestLocationPoint,
                bloodGroup: user.bloodGroup,
                user: data.userId
            }
        }

        //  Save request to DB
        const donationRequest = new DonationRequest();
        Object.assign(donationRequest, dataToSave);
        const savedRequest = await this.donationRepository.createDonationRequest(donationRequest);

        jobData = {
            bloodGroup: savedRequest.bloodGroup,
            requestID: savedRequest.id,
            requestLocation: {
                latitude: data.requestLocation.latitude,
                longitude: data.requestLocation.longitude,
            },
            urgency: data.urgency,
            userId: data.userId // requester ID
        }

        // Add a job to the donation request queue to find & notify nearby donors
        await donationRequestQueue.add('donationRequestJob', {requestData: jobData});
        return savedRequest;
    }

    // --- get nearby donors --- //
    // @param latitude: number
    // @param longitude: number
    // @param distance: number
    // @param bloodGroup: BloodType
    // @param requesterID: user ID
    async getNearbyDonors(latitude: number, longitude: number, radiusInMeters: number, bloodGroup: BloodType, requesterID: string): Promise<User[]> {
        return await this.donationRepository.findNearbyDonors(latitude, longitude, radiusInMeters, bloodGroup, requesterID);
    }

    //--- confirm donor availability for donation ---//
    //@desc: This commits the donor to that request to avoid receiving notifications from other requests
    //      until they cancel the commitment OR donate and become feasible to donate again
    //@desc: It creates a new donation but with a status of 'scheduled'
    async confirmDonorAvailability(userID: string, requestID: string) {
        // First check if user already has a scheduled donation
        const existingDonation = await this.donationRepository.findOne({
            where: {
                donor: {id: userID},
                status: 'scheduled'
            }
        });
        if (existingDonation) {
            throw new Error('You already have a scheduled donation. Please complete or cancel it before scheduling another.');
        }

        // Check if the request exists and is still open
        const request = await this.donationRepository.findRequest(requestID)
        if (!request || request.status !== 'open') {
            throw new Error('Donation request not found or no longer open');
        }
        if (request.user.id === userID) {
            throw new Error('You cannot donate to yourself');
        }

        // create a new donation
        const donation = new Donation();
        donation.donor = {id: userID} as User
        donation.request = {id: requestID} as DonationRequest
        donation.status = 'scheduled'
        donation.donationDate = new Date()

        return await this.donationRepository.createDonation(donation);
    }

    //--- Get single donation request ---//
    // @param requestID 
    async getDonationRequest(requestID: string): Promise<DonationRequest | null> {
        return await this.donationRepository.findRequest(requestID);
    }

    //--- Get all user donation requests ---//
    // @param userID 
    async getUserDonationRequests(userID: string): Promise<[DonationRequest[], number]> {
        return await this.donationRepository.findUserDonationRequests(userID);
    }

    //--- Get all open donation requests ---//
    // @param page: number 
    // @param limit: number
    // @param latitude: number -> optional
    // @param longitude: number -> optional
    // @param radius (in meters): number -> optional
    async getOpenDonationRequests(page: number, limit: number, latitude?: number, longitude?: number, radius?: number ): Promise<[DonationRequest[], number]> {
        const offset = (page - 1) * limit;
        return await this.donationRepository.findOpenDonationRequests(offset, limit, latitude, longitude, radius);
    }


}
