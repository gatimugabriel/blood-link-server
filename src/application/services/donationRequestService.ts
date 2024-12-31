import { donationRequestQueue } from "../../bull/queues";
import { DonationRequest } from "../../domain/entity/DonationRequest";
import { User } from "../../domain/entity/User";
import { DonationRepository } from "../../infrastructure/repositories/donationRepository";
import { createPoint } from "../../utils/database";
import { CreateDonationRequestDto } from "../dtos/donationRequestDto";
import { BloodType } from "../../domain/value-objects/bloodType";
import { UserRepository } from "../../infrastructure/repositories/userRepository";

export class DonationRequestService {
    constructor(
        private donationRepository: DonationRepository,
        private userRepo: UserRepository
    ) {
    }

    // --- create a new donation request --- //
    async createNewDonationRequest(dto: CreateDonationRequestDto): Promise<DonationRequest> {
        let requestLocationPoint
        let dataToSave
        console.log("dto -> ", dto);


        requestLocationPoint = createPoint(dto.requestLocation.latitude, dto.requestLocation.longitude)

        if (dto.requestingFor !== "" && dto.requestingFor === "other") {
            dataToSave = { ...dto, requestLocation: requestLocationPoint, user: dto.userId, requestFor: dto.requestingFor }

        } else {            
            // Check if the user has any open requests for themselves
            const existingRequests: DonationRequest[] = await this.donationRepository.findOpenRequestsByUser(dto.userId);
            console.log("existingRequests", existingRequests);

            
            const hasOpenSelfRequest = existingRequests.some(item =>
                item && item.requestFor === "self"
            );
            if (hasOpenSelfRequest) {
                throw new Error("You already have an open donation request. Please hang tight as we reach more donors...");
            }

            const user = await this.userRepo.findByID(dto.userId);
            dataToSave = { ...dto, requestLocation: requestLocationPoint, bloodGroup: user?.bloodGroup, user: dto.userId }
        }

        console.log(dataToSave);


        //  Save request to DB
        const donationRequest = new DonationRequest();
        Object.assign(donationRequest, dataToSave);
        const savedRequest = await this.donationRepository.createDonationRequest(donationRequest);

        // Add a job to the donation request queue to find & notify nearby donors
        await donationRequestQueue.add('donationRequestJob', { requestData: dto });
        return savedRequest;
    }

    // --- get nearby donors --- //
    // @param latitude: number
    // @param longitude: number
    // @param distance: number
    // @param bloodGroup: BloodType
    // @param requesterID: user ID
    async getNearbyDonors(latitude: number, longitude: number, radiusInMeters: number, bloodGroup: BloodType, requesterID: string): Promise<User[]> {
        return this.donationRepository.findNearbyDonors(latitude, longitude, radiusInMeters, bloodGroup, requesterID);
    }

    //--- confirm donor availability for donation ---//
    async confirmDonorAvailability() {

    }

    //--- Get single donation request ---//
    // @param requestID 
    async getDonationRequest(requestID: string): Promise<DonationRequest[]> {
        return this.donationRepository.findRequest(requestID);
    }

    //--- Get all user donation requests ---//
    // @param userID 
    async getUserDonationRequests(userID: string): Promise<DonationRequest[]> {
        return this.donationRepository.findUserDonationRequests(userID);
    }

    //--- Get all open donation requests ---//
    // @param page: number 
    // @param limit: number
    async getOpenDonationRequests(page: number, limit: number): Promise<[DonationRequest[], number]> {
        const offset = (page - 1) * limit;
        return this.donationRepository.findOpenDonationRequests(offset, limit);
    }


}
