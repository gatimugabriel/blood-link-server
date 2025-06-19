import {NextFunction, Request, Response} from "express";
import {DB} from "../../infrastructure/database/data-source";
import {Donation} from "../../domain/entity/Donation";
import {ExtendedRequest} from "../../types/custom";
import {DonationService} from "../../application/services/donationService";
import {DonationRepository} from "../../domain/repositories/donationRepository";
import {UserRepository} from "../../domain/repositories/userRepository";

export class DonationController {
    private donationRepository = DB.getRepository(Donation);
    private readonly service: DonationService

    constructor() {
        const donationRepository = new DonationRepository();
        const userRepository = new UserRepository();
        this.service = new DonationService(donationRepository, userRepository);
    }

    //--- Confirm Donor Availability to donate  ---//
    //   Prevents donor from being notified again within their donation timeframe
    async confirmDonorAvailability(req: ExtendedRequest, res: Response, next: NextFunction) {
        const {user} = req
        const userID = user?.userID as string
        const {id} = req.params

        try {
            const data = await this.service.confirmDonorAvailability(userID, id);
            res.status(201).json({message: "Your availability has been confirmed successfully!", data});
        } catch (error) {
            next(error);
        }
    }

    //--- Complete donation ---//
    async completeDonation(req: ExtendedRequest, res: Response, next: NextFunction) {
        const {donationID} = req.params;

        try {
            const donation = await this.service.completeDonation(donationID);
            res.status(200).json({
                message: "Donation completed successfully!",
                donation: {
                    id: donation.id,
                    status: donation.status,
                    donationDate: donation.donationDate
                }
            });
        } catch (error) {
            next(error);
        }
    }

    //--- Cancel donation ---//
    async cancelDonation(req: ExtendedRequest, res: Response, next: NextFunction) {
        const {id} = req.params;

        try {
            const donation = await this.service.cancelDonation(id);
            res.status(200).json({
                message: "Donation cancelled successfully!",
                donation: {
                    id: donation.id,
                    status: donation.status
                }
            });
        } catch (error) {
            next(error);
        }
    }

    //--- Get all donations with filters ---//
    async getAllDonations(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const sortBy = req.query.sortBy as string || 'createdAt';
            const sortOrder = req.query.sortOrder as 'asc' | 'desc' || 'desc';
            const status = req.query.status as string;
            const dateFrom = req.query.dateFrom as string;
            const dateTo = req.query.dateTo as string;
            const search = req.query.search as string;
            const bloodGroup = req.query.bloodGroup as string;
            const donorId = req.query.donorId as string;
            const requestId = req.query.requestId as string;

            if (limit > 100) {
                return res.status(400).json({ message: "Limit cannot be greater than 100. Please reduce your limit" });
            }

            const [donations, total] = await this.service.getAllDonations(
                page,
                limit,
                sortBy,
                sortOrder,
                status,
                dateFrom,
                dateTo,
                search,
                bloodGroup,
                donorId,
                requestId,
            );

            res.status(200).json({
                data: donations,
                pagination: {
                    dataCount: donations.length,
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    //--- Get single donation ---//
    async getDonation(req: Request, res: Response, next: NextFunction) {
        try {
            const {id} = req.params;
            const donation = await this.service.getDonation(id);

            if (!donation) {
                return res.status(404).json({
                    success: false,
                    message: 'Donation not found'
                });
            }

            res.status(200).json(donation);
        } catch (error) {
            next(error);
        }
    }

    //--- Update donation status ---//
    async updateDonation(req: Request, res: Response, next: NextFunction) {
        try {
            const {id} = req.params;
            const {status} = req.body;

            const donation = await this.service.updateDonation(id, status);

            res.status(200).json({
                success: true,
                message: 'Donation status updated successfully',
                donation: {
                    id: donation.id,
                    status: donation.status
                }
            });
        } catch (error) {
            next(error);
        }
    }
}