import { Request, Response } from "express";
import {DB} from "../../infrastructure/database/data-source";
import { Donation } from "../../domain/entity/Donation";
import { Between } from "typeorm";

export class DonationAdminController {
    private donationRepository = DB.getRepository(Donation);

    async getAllDonations(req: Request, res: Response) {
        try {
            const donations = await this.donationRepository.find({
                relations: ['donor', 'request'],
                order: { createdAt: 'DESC' }
            });
            
            res.json({
                data: donations
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching donations'
            });
        }
    }

    async getDonation(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const donation = await this.donationRepository.findOne({
                where: { id },
                relations: ['donor', 'request']
            });

            if (!donation) {
                return res.status(404).json({
                    success: false,
                    message: 'Donation not found'
                });
            }

            res.json(donation);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching donation'
            });
        }
    }

    async getDonationStats(req: Request, res: Response) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const [total, todayDonations, statusCounts, timeline] = await Promise.all([
                this.donationRepository.count(),
                this.donationRepository.count({
                    where: {
                        createdAt: Between(today, new Date()),
                        status: 'completed'
                    }
                }),
                this.donationRepository
                    .createQueryBuilder('donation')
                    .select('donation.status', 'status')
                    .addSelect('COUNT(*)', 'count')
                    .groupBy('donation.status')
                    .getRawMany(),
                this.donationRepository
                    .createQueryBuilder('donation')
                    .select('DATE(donation.createdAt)', 'date')
                    .addSelect('COUNT(*)', 'count')
                    .groupBy('DATE(donation.createdAt)')
                    .orderBy('date', 'DESC')
                    .limit(30)
                    .getRawMany()
            ]);

            const byStatus = statusCounts.reduce((acc: any, curr: any) => {
                acc[curr.status] = parseInt(curr.count);
                return acc;
            }, {});

            const successRate = Math.round(
                (byStatus['completed'] || 0) / total * 100
            );

            res.json({
                total,
                today: todayDonations,
                successRate,
                byStatus,
                timeline
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching statistics'
            });
        }
    }

    async updateDonationStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const donation = await this.donationRepository.findOne({
                where: { id }
            });

            if (!donation) {
                return res.status(404).json({
                    success: false,
                    message: 'Donation not found'
                });
            }

            donation.status = status;
            await this.donationRepository.save(donation);

            res.json({
                success: true,
                message: 'Status updated successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error updating status'
            });
        }
    }

    async exportDonations(req: Request, res: Response) {
        try {
            const donations = await this.donationRepository.find({
                relations: ['donor', 'request'],
                order: { createdAt: 'DESC' }
            });

            // Convert to CSV
            const fields = ['ID', 'Donor', 'Status', 'Donation Date', 'Created At'];
            const csv = [
                fields.join(','),
                ...donations.map((d: any) => [
                    d.id,
                    d.donor.firstName + ' ' + d.donor.lastName,
                    d.status,
                    new Date(d.donationDate).toLocaleDateString(),
                    new Date(d.createdAt).toLocaleDateString()
                ].join(','))
            ].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=donations.csv');
            res.send(csv);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error exporting donations'
            });
        }
    }
}