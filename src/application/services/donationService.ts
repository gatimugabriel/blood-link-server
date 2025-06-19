import {DonationRepository} from "../../domain/repositories/donationRepository";
import {UserRepository} from "../../domain/repositories/userRepository";
import {Donation} from "../../domain/entity/Donation";
import {User} from "../../domain/entity/User";
import {DonationRequest} from "../../domain/entity/DonationRequest";

export class DonationService {
    constructor(
        private donationRepository: DonationRepository,
        private userRepo: UserRepository
    ) {
    }

    //--- confirm donor availability for donation ---//
    //@desc: This commits the donor to that request to avoid receiving notifications from other requests
    //      until they cancel the commitment OR donate and become feasible to donate again
    //@desc: It creates a new donation but with a status of 'scheduled'
    async confirmDonorAvailability(userID: string, requestID: string) {
        // First check if user already has a scheduled donation
        const existingDonation = await this.donationRepository.findDonation({
            where: {
                donor: {id: userID},
                status: 'scheduled'
            }
        });
        if (existingDonation) {
            throw new Error('You already have a scheduled donation. Please complete or cancel it before scheduling another.');
        }

        // Check if the request exists and is still open
        const request = await this.donationRepository.findRequestById(requestID)
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

    //--- Complete donation ---//
    //@desc: This completes a scheduled donation and updates the request status
    async completeDonation(donationID: string): Promise<Donation> {
        // Find the donation
        const donation = await this.donationRepository.findDonation({
            where: {id: donationID},
            relations: {request: true, donor: true}
        });

        if (!donation) {
            throw new Error('Donation not found');
        }

        if (donation.status !== 'scheduled') {
            throw new Error('Only scheduled donations can be completed');
        }

        // Update donation status to completed
        donation.status = 'completed';
        donation.donationDate = new Date();

        const updatedDonation = await this.donationRepository.createDonation(donation);

        // Update the request status to fulfilled
        const request = donation.request;
        request.status = 'fulfilled';
        await this.donationRepository.updateDonationRequest(request);

        // Update donor's last donation date
        const donor = donation.donor;
        donor.lastDonationDate = new Date();
        await this.userRepo.updateUser(donor);

        return updatedDonation;
    }

    //--- Cancel donation ---//
    //@desc: This cancels a scheduled donation
    async cancelDonation(donationID: string): Promise<Donation> {
        const donation = await this.donationRepository.findDonation({
            where: {id: donationID}
        });

        if (!donation) {
            throw new Error('Donation not found');
        }

        if (donation.status !== 'scheduled') {
            throw new Error('Only scheduled donations can be cancelled');
        }

        donation.status = 'cancelled';
        return await this.donationRepository.createDonation(donation);
    }

    //--- Get all donations with filters ---//
    async getAllDonations(
        page: number,
        limit: number,
        sortBy: string = 'createdAt',
        sortOrder: 'asc' | 'desc' = 'desc',
        status?: string,
        dateFrom?: string,
        dateTo?: string,
        search?: string,
        bloodGroup?: string,
        donorId?: string,
        requestId?: string,
    ): Promise<[Donation[], number]> {
        const offset = (page - 1) * limit;
        return await this.donationRepository.findDonations(
            offset,
            limit,
            sortBy,
            sortOrder.toUpperCase() as "ASC" | "DESC",
            status,
            dateFrom,
            dateTo,
            search,
            bloodGroup,
            donorId,
            requestId,
        );
    }

    //--- Get single donation ---//
    async getDonation(donationID: string): Promise<Donation | null> {
        return await this.donationRepository.findDonation({
            where: { id: donationID },
            relations: { 
                donor: true, 
                request: { user: true } 
            }
        });
    }

    //--- Update donation status ---//
    async updateDonation(donationID: string, status: string): Promise<Donation> {
        const donation = await this.donationRepository.findDonation({
            where: { id: donationID }
        });

        if (!donation) {
            throw new Error('Donation not found');
        }

        donation.status = status;
        return await this.donationRepository.createDonation(donation);
    }
}