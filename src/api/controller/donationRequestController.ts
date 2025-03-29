import { NextFunction, Response } from "express";
import { DonationRequestService } from "../../application/services/donationRequestService";
import { DonationRepository } from "../../domain/repositories/donationRepository";
import { ExtendedRequest } from "../../types/custom";
import { UserRepository } from "../../domain/repositories/userRepository";

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
        const { requestID } = req.params

        try {
            const data = await this.donationRequestService.confirmDonorAvailability(userID, requestID);
            res.status(201).json({ message: "Your availability has been confirmed successfully!", data });
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

    // TODO -> handle next 2 methods
    async updateDonationRequest(req: ExtendedRequest, res: Response, next: NextFunction) {
        const { requestID } = req.params
        try {
            const data = await this.donationRequestService.getDonationRequest(requestID);
            res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    }

    async deleteDonationRequest(req: ExtendedRequest, res: Response, next: NextFunction) {
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
            res.status(200).json({ data: data[0], count: data[1] });
        } catch (error) {
            next(error);
        }
    }

    //--- Get all open donation requests ---//
    async getOpenDonationRequests(req: ExtendedRequest, res: Response, next: NextFunction) {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const latitude = parseFloat(req.query.lat as string);
        const longitude = parseFloat(req.query.long as string);
        const radius = parseFloat(req.query.radius as string) || 150000;

        if (limit > 100) {
            return res.status(400).json({ message: "Limit cannot be greater than 100. Please reduce your limit" });
        }

        console.log(page, limit, latitude, longitude, radius)
        try {
            const data = await this.donationRequestService.getOpenDonationRequests(page, limit, latitude, longitude, radius);
            console.log(data)
            res.status(200).json({ data: data[0], page: page, count: data[0].length, totalCount: data[1] });
        } catch (error) {
            console.error(error)
            next(error);
        }
    }


}
