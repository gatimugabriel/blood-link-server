import {NextFunction, Response} from "express";
import {DonationRequestService} from "../../application/services/donationRequestService";
import {DonationRepository} from "../../domain/repositories/donationRepository";
import {ExtendedRequest} from "../../types/custom";
import {UserRepository} from "../../domain/repositories/userRepository";

export class DonationRequestController {
    private readonly donationRequestService: DonationRequestService;

    constructor() {
        const donationRepository = new DonationRepository();
        const userRepository = new UserRepository();
        this.donationRequestService = new DonationRequestService(donationRepository, userRepository);
    }

    //--- create a new donation request ---//
    async createDonationRequest(req: ExtendedRequest, res: Response, next: NextFunction) {
        const {user} = req
        const userID = user?.userID as string

        try {
            const requestData = {...req.body, userId: userID}
            const data = await this.donationRequestService.createNewDonationRequest(requestData);
            res.status(201).json(data);
        } catch (error) {
            next(error);
        }
    }

    async updateDonationRequest(req: ExtendedRequest, res: Response, next: NextFunction) {
        const {requestID} = req.params
        try {
            // const data = await this.donationRequestService.updateDonationRequest(requestID);
            res.status(200).json("to do!");
        } catch (error) {
            next(error);
        }
    }

    async deleteDonationRequest(req: ExtendedRequest, res: Response, next: NextFunction) {
        const {requestID} = req.params
        try {
            await this.donationRequestService.deleteDonationRequest(requestID);
            res.status(200).json({message: "Blood request deleted successfully"});
        } catch (error) {
            next(error);
        }
    }

    async getDonationRequest(req: ExtendedRequest, res: Response, next: NextFunction) {
        const {id} = req.params

        try {
            const data = await this.donationRequestService.getDonationRequest(id);
            res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    }

    async getUserDonationRequests(req: ExtendedRequest, res: Response, next: NextFunction) {
        const {user} = req
        const userID = user?.userID as string
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        try {
            const [data, total] = await this.donationRequestService.getUserDonationRequests(userID);
            res.status(200).json({
                data,
                pagination: {
                    dataCount: data.length,
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / data.length)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async fetchDonationRequests(req: ExtendedRequest, res: Response, next: NextFunction) {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const latitude = parseFloat(req.query.latitude as string);
        const longitude = parseFloat(req.query.longitude as string);
        const radius = parseFloat(req.query.radius as string) || 150000;
        const sortBy = req.query.sortBy as string || 'createdAt';
        const sortOrder = req.query.sortOrder as 'asc' | 'desc' || 'desc';
        const status = req.query.status as string;
        const dateFrom = req.query.dateFrom as string;
        const dateTo = req.query.dateTo as string;
        const search = req.query.search as string;
        const bloodGroup = req.query.bloodGroup as string;
        const urgency = req.query.urgency as string;

        if (limit > 100) {
            return res.status(400).json({message: "Limit cannot be greater than 100. Please reduce your limit"});
        }

        try {
            // const data = await this.donationRequestService.listDonationRequestsWithinRange(page, limit, latitude, longitude, radius);
            const [requests, total] = await this.donationRequestService.listDonationRequests(
                page,
                limit,
                latitude,
                longitude,
                radius,
                sortBy,
                sortOrder,
                status,
                dateFrom,
                dateTo,
                search,
                bloodGroup,
                urgency,
            );

            res.status(200).json({
                data: requests,
                pagination: {
                    dataCount: requests.length,
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error(error)
            next(error);
        }
    }
}