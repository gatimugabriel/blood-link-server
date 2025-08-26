import { DonationRepository } from "../../domain/repositories/donationRepository";
import { UserRepository } from "../../domain/repositories/userRepository";
import { Donation } from "../../domain/entity/Donation";
import { User } from "../../domain/entity/User";
import { DonationRequest } from "../../domain/entity/DonationRequest";
import { NotificationService } from "./notificationService";

export class DonationService {
    private notificationService: NotificationService;

    constructor(
        private donationRepository: DonationRepository,
        private userRepo: UserRepository
    ) {
        this.notificationService = new NotificationService();
    }

    //--- confirm donor availability for donation ---//
    //@desc: This commits the donor to that request to avoid receiving notifications from other requests
    //      until they cancel the commitment OR donate and become feasible to donate again
    //@desc: It creates a new donation but with a status of 'scheduled'
    async confirmDonorAvailability(userID: string, requestID: string, scheduledDate?: Date) {
        // First check if user already has a scheduled donation
        const existingDonation = await this.donationRepository.findDonation({
            where: {
                donor: { id: userID },
                status: 'scheduled'
            }
        });
        if (existingDonation) {
            throw new Error('You already have a scheduled donation. Please complete or cancel it before scheduling another.');
        }

        const request = await this.donationRepository.findRequestById(requestID)
        if (!request || request.status !== 'open') {
            throw new Error('Donation request not found or no longer open');
        }
        if (request.user.id === userID) {
            throw new Error('You cannot donate to yourself');
        }

        // Get donor details 
        const donor = await this.userRepo.findUser({ where: { id: userID } });
        if (!donor) {
            throw new Error('Donor not found');
        }

        const donation = new Donation();
        donation.donor = { id: userID } as User
        donation.request = { id: requestID } as DonationRequest
        donation.status = 'scheduled'
        // Use provided scheduled date or current date as fallback
        donation.donationDate = scheduledDate || new Date()

        const createdDonation = await this.donationRepository.createDonation(donation);

        // Notify the requester about the incoming donor
        try {
            const requester = request.user;
            if (requester.tokens && requester.tokens.length > 0) {
                const donationDateStr = scheduledDate
                    ? `scheduled for ${scheduledDate.toLocaleDateString()}`
                    : 'immediately';

                await this.notificationService.sendNotification(
                    [{ tokens: requester.tokens } as User],
                    {
                        title: "Donor Found!",
                        subTitle: `${donor.firstName} ${donor.lastName} has confirmed availability to donate ${request.bloodGroup} blood ${donationDateStr}`,
                        id: `donor-confirmation-${createdDonation.id}`,
                        body: {
                            type: "DONOR_CONFIRMATION",
                            donationId: createdDonation.id,
                            donorName: `${donor.firstName} ${donor.lastName}`,
                            bloodGroup: request.bloodGroup,
                            requestId: requestID,
                            urgency: request.urgency,
                            scheduledDate: scheduledDate?.toISOString()
                        }
                    }
                );
            }
        } catch (notificationError) {
            console.error('Failed to send notification to requester:', notificationError);
        }

        return createdDonation;
    }

    //--- Complete donation ---//
    //@desc: This completes a scheduled donation and updates the request status
    async completeDonation(donationID: string): Promise<Donation> {
        // Find the donation
        const donation = await this.donationRepository.findDonation({
            where: { id: donationID },
            relations: { request: true, donor: true }
        });

        if (!donation) {
            throw new Error('Donation not found');
        }

        if (donation.status !== 'scheduled') {
            throw new Error('Only scheduled donations can be completed');
        }

        donation.status = 'completed';
        donation.donationDate = new Date();
        const updatedDonation = await this.donationRepository.createDonation(donation);

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
            where: { id: donationID }
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
        urgency?: string
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
            urgency
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

    //--- Get donations by request ID ---//
    async getDonationsByRequest(requestID: string): Promise<Donation[]> {
        const donations = await this.donationRepository.findManyDonations({
            where: { request: { id: requestID } },
            relations: {
                donor: true,
                request: true
            },
            order: { createdAt: 'DESC' }
        });

        return donations;
    }

    //--- Get user's donations ---//
    async getUserDonations(userID: string): Promise<Donation[]> {
        const donations = await this.donationRepository.findManyDonations({
            where: { donor: { id: userID } },
            relations: {
                donor: true,
                request: { user: true }
            },
            order: { createdAt: 'DESC' }
        });

        return donations;
    }
}