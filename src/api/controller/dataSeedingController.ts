import { NextFunction, Request, Response } from "express";
import { DataSeedingService } from "../../application/services/dataSeedingService";

export class DataSeedingController {
    private readonly dataSeedingService: DataSeedingService;

    constructor() {
        this.dataSeedingService = new DataSeedingService();
    }

    async seedUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const users = await this.dataSeedingService.seedUsers();
            res.status(201).json({ 
                message: "Additional users seeded successfully", 
                count: users.length,
                users: users.map(user => ({ id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}` }))
            });
        } catch (error) {
            next(error);
        }
    }

    async seedDonationRequests(req: Request, res: Response, next: NextFunction) {
        try {
            const requests = await this.dataSeedingService.seedDonationRequests();
            res.status(201).json({ 
                message: "Donation requests seeded successfully", 
                count: requests.length,
                requests: requests.map(req => ({ 
                    id: req.id, 
                    bloodGroup: req.bloodGroup, 
                    urgency: req.urgency,
                    status: req.status,
                    requestFor: req.requestFor
                }))
            });
        } catch (error) {
            next(error);
        }
    }

    async seedDonations(req: Request, res: Response, next: NextFunction) {
        try {
            const donations = await this.dataSeedingService.seedDonations();
            res.status(201).json({ 
                message: "Donations seeded successfully", 
                count: donations.length,
                donations: donations.map(donation => ({ 
                    id: donation.id, 
                    status: donation.status,
                    donationDate: donation.donationDate
                }))
            });
        } catch (error) {
            next(error);
        }
    }

    async seedAllData(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await this.dataSeedingService.seedAllData();
            res.status(201).json({ 
                message: "All data seeded successfully", 
                summary: {
                    usersCreated: result.users.length,
                    requestsCreated: result.requests.length,
                    donationsCreated: result.donations.length
                },
                details: {
                    users: result.users.map(user => ({ id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}` })),
                    requests: result.requests.map(req => ({ 
                        id: req.id, 
                        bloodGroup: req.bloodGroup, 
                        urgency: req.urgency,
                        status: req.status,
                        requestFor: req.requestFor
                    })),
                    donations: result.donations.map(donation => ({ 
                        id: donation.id, 
                        status: donation.status,
                        donationDate: donation.donationDate
                    }))
                }
            });
        } catch (error) {
            next(error);
        }
    }
} 