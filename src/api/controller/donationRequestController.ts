import { NextFunction, Response } from "express";
import { DonationRequestService } from "../../application/services/donationRequestService";
import { DonationRepository } from "../../infrastructure/repositories/donationRepository";
import { ExtendedRequest } from "../../types/custom";
import { UserRepository } from "../../infrastructure/repositories/userRepository";

export class DonationRequestController {
    private readonly donationRequestService: DonationRequestService;

    constructor() {
        const donationRepository = new DonationRepository();
        const userRepository = new UserRepository();
        this.donationRequestService = new DonationRequestService(donationRepository, userRepository);
    }

    //--- create a new donation request ---//
    async createDonationRequest(req: ExtendedRequest, res: Response, next: NextFunction) {
        const { user } = req
        const userID = user?.userID as string

        try {
            const requestData = { ...req.body, userId: userID }
            const data = await this.donationRequestService.createNewDonationRequest(requestData);
            res.status(201).json(data);
        } catch (error) {
            next(error);
        }
    }

    //--- Confirm Donor Availability to donate  ---//
    //   Prevents donor from being notified again within their donation timeframe
    async confirmDonorAvailability(req: ExtendedRequest, res: Response, next: NextFunction) {
        const { user } = req
        const userID = user?.userID as string

        try {
            const requestData = { ...req.body, requesterID: userID }
            const request = await this.donationRequestService.createNewDonationRequest(requestData);
            res.status(201).json({ success: true, data: request });
        } catch (error) {
            next(error);
        }
    }

    async getDonationRequest(req: ExtendedRequest, res: Response, next: NextFunction) {
        const { requestID } = req.params
        try {
            const data = await this.donationRequestService.getDonationRequest(requestID);
            res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    }


    //--- Get user donation requests ---//
    async getUserDonationRequests(req: ExtendedRequest, res: Response, next: NextFunction) {
        const { user } = req
        const userID = user?.userID as string

        try {
            const data = await this.donationRequestService.getUserDonationRequests(userID);
            res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    }

    //--- Get all open donation requests ---//
    async getOpenDonationRequests(req: ExtendedRequest, res: Response, next: NextFunction) {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        try {
            const data = await this.donationRequestService.getOpenDonationRequests(page, limit);
            res.status(200).json({ data });
        } catch (error) {
            next(error);
        }
    }



}
