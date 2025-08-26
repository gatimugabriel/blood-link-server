import { donationRequestQueue } from "../../infrastructure/bull/queues";
import { DonationRequest } from "../../domain/entity/DonationRequest";
import { User } from "../../domain/entity/User";
import { DonationRepository } from "../../domain/repositories/donationRepository";
import { createPoint } from "../../utils/database";
import { CreateDonationRequestDto, UpdateDonationRequestDto } from "../dtos/donationRequestDto";
import { BloodType } from "../../domain/value-objects/bloodType";
import { UserRepository } from "../../domain/repositories/userRepository";
import { Donation } from "../../domain/entity/Donation";

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
                item && item.requestFor === "self" && item.status === "open"
            );
            if (hasOpenSelfRequest) {
                throw new Error("You already have an open donation request for yourself. Please hang tight as we reach more donors.");
            }

            const user = await this.userRepo.findUser({ where: { id: data.userId } });
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
        await donationRequestQueue.add('donationRequestJob', { requestData: jobData });
        return savedRequest;
    }

    // --- update donation request --- //
    async updateDonationRequest(requestID: string, updateData: UpdateDonationRequestDto, userID?: string): Promise<DonationRequest> {
        const existingRequest = await this.donationRepository.findRequestById(requestID);
        if (!existingRequest) {
            throw new Error("Donation request not found");
        }

        // ownership verification
        if (userID && existingRequest.user.id !== userID) {
            throw new Error("You are not authorized to update this request");
        }

        //  status transitions
        if (updateData.status) {
            const validStatuses = ['open', 'fulfilled', 'closed'];
            if (!validStatuses.includes(updateData.status)) {
                throw new Error("Invalid status. Valid statuses are: open, fulfilled, closed");
            }

            if (existingRequest.status === 'fulfilled' && updateData.status === 'open') {
                throw new Error("Cannot reopen a fulfilled request");
            }
            if (existingRequest.status === 'closed' && updateData.status === 'open') {
                throw new Error("Cannot reopen a closed request");
            }
        }

        Object.assign(existingRequest, updateData);
        existingRequest.updatedAt = new Date();

        return await this.donationRepository.updateDonationRequest(existingRequest);
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

    //--- Get single donation request ---//
    // @param requestID 
    async getDonationRequest(requestID: string): Promise<DonationRequest | null> {
        return await this.donationRepository.findRequestById(requestID);
    }

    //--- Get all user donation requests ---//
    // @param userID 
    async getUserDonationRequests(userID: string): Promise<[DonationRequest[], number]> {
        return await this.donationRepository.findUserDonationRequests(userID);
    }

    /* List requests
    * -- Can  filter within range when a point(lat & long) and radius are provided
     */
    async listDonationRequests(
        page: number,
        limit: number,
        latitude?: number,
        longitude?: number,
        radius?: number,
        sortBy: string = 'createdAt',
        sortOrder: 'asc' | 'desc' = 'desc',
        status?: string,
        dateFrom?: string,
        dateTo?: string,
        search?: string,
        bloodGroup?: string,
        urgency?: string,
    ): Promise<[DonationRequest[], number]> {
        const offset = (page - 1) * limit;

        return await this.donationRepository.findDonationRequests(
            offset,
            limit,
            latitude,
            longitude,
            radius,
            sortBy,
            sortOrder.toUpperCase() as "ASC" | "DESC",
            status,
            dateFrom,
            dateTo,
            search,
            bloodGroup,
            urgency,
        );
    }

    //--- Delete donation request ---//
    async deleteDonationRequest(requestID: string): Promise<void> {
        const request = await this.donationRepository.findRequestById(requestID);
        if (!request) {
            throw new Error("Blood request not found");
        }
        await this.donationRepository.deleteDonationRequest(requestID);
    }
}
