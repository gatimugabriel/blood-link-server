import { Repository } from "typeorm";
import { DB as AppDataSource } from "../../infrastructure/database/data-source";
import { DonationRequest } from "../../domain/entity/DonationRequest";
import { Donation } from "../../domain/entity/Donation";
import { User } from "../../domain/entity/User";

export interface DashboardStats {
    totalUsers: number;
    totalDonationRequests: number;
    totalDonations: number;
    activeRequests: number;
    completedDonations: number;
    successRate: number;
}

export interface BloodTypeReport {
    bloodType: string;
    requestCount: number;
    donationCount: number;
    fulfillmentRate: number;
}

export interface GeographicReport {
    region: string;
    requestCount: number;
    donorCount: number;
    avgResponseTime: number;
}

export interface TrendReport {
    period: string;
    requests: number;
    donations: number;
    newUsers: number;
}

export class ReportService {
    private donationRequestRepo: Repository<DonationRequest>;
    private donationRepo: Repository<Donation>;
    private userRepo: Repository<User>;

    constructor() {
        this.donationRequestRepo = AppDataSource.getRepository(DonationRequest);
        this.donationRepo = AppDataSource.getRepository(Donation);
        this.userRepo = AppDataSource.getRepository(User);
    }

    async getDashboardStats(): Promise<DashboardStats> {
        const [totalUsers, totalDonationRequests, totalDonations, activeRequests, completedDonations] = await Promise.all([
            this.userRepo.count({ where: { status: 'active' } }),
            this.donationRequestRepo.count(),
            this.donationRepo.count(),
            this.donationRequestRepo.count({ where: { status: 'open' } }),
            this.donationRepo.count({ where: { status: 'completed' } })
        ]);

        const successRate = totalDonationRequests > 0 ? (completedDonations / totalDonationRequests) * 100 : 0;

        return {
            totalUsers,
            totalDonationRequests,
            totalDonations,
            activeRequests,
            completedDonations,
            successRate: Math.round(successRate * 100) / 100
        };
    }

    async getBloodTypeReport(): Promise<BloodTypeReport[]> {
        const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

        const reports = await Promise.all(
            bloodTypes.map(async (bloodType) => {
                const [requestCount, donationCount] = await Promise.all([
                    this.donationRequestRepo.count({ where: { bloodGroup: bloodType as any } }),
                    this.donationRepo
                        .createQueryBuilder('donation')
                        .innerJoin('donation.request', 'request')
                        .where('request.bloodGroup = :bloodType', { bloodType })
                        .andWhere('donation.status = :status', { status: 'completed' })
                        .getCount()
                ]);

                const fulfillmentRate = requestCount > 0 ? (donationCount / requestCount) * 100 : 0;

                return {
                    bloodType,
                    requestCount,
                    donationCount,
                    fulfillmentRate: Math.round(fulfillmentRate * 100) / 100
                };
            })
        );

        return reports.sort((a, b) => b.requestCount - a.requestCount);
    }

    async getTrendReport(days: number = 30): Promise<TrendReport[]> {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        const trends = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dayStart = new Date(currentDate);
            const dayEnd = new Date(currentDate);
            dayEnd.setHours(23, 59, 59, 999);

            const [requests, donations, newUsers] = await Promise.all([
                this.donationRequestRepo
                    .createQueryBuilder('request')
                    .where('request.createdAt >= :dayStart AND request.createdAt <= :dayEnd', { dayStart, dayEnd })
                    .getCount(),
                this.donationRepo
                    .createQueryBuilder('donation')
                    .where('donation.createdAt >= :dayStart AND donation.createdAt <= :dayEnd', { dayStart, dayEnd })
                    .getCount(),
                this.userRepo
                    .createQueryBuilder('user')
                    .where('user.createdAt >= :dayStart AND user.createdAt <= :dayEnd', { dayStart, dayEnd })
                    .getCount()
            ]);

            trends.push({
                period: currentDate.toISOString().split('T')[0],
                requests,
                donations,
                newUsers
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return trends;
    }

    async getUrgencyReport() {
        const urgencyLevels = ['low', 'medium', 'high'];

        return await Promise.all(
            urgencyLevels.map(async (urgency) => {
                const [total, fulfilled] = await Promise.all([
                    this.donationRequestRepo.count({ where: { urgency } }),
                    this.donationRequestRepo.count({ where: { urgency, status: 'fulfilled' } })
                ]);

                return {
                    urgency,
                    total,
                    fulfilled,
                    fulfillmentRate: total > 0 ? Math.round((fulfilled / total) * 10000) / 100 : 0
                };
            })
        );
    }

    async exportDonationData(format: 'csv' | 'json' = 'csv') {
        const donations = await this.donationRepo
            .createQueryBuilder('donation')
            .leftJoinAndSelect('donation.request', 'request')
            .leftJoinAndSelect('donation.donor', 'donor')
            .leftJoinAndSelect('request.user', 'requester')
            .select([
                'donation.id',
                'donation.status',
                'donation.donationDate',
                'donation.createdAt',
                'request.bloodGroup',
                'request.urgency',
                'request.units',
                'request.healthFacility',
                'donor.firstName',
                'donor.lastName',
                'donor.email',
                'requester.firstName',
                'requester.lastName',
                'requester.email'
            ])
            .getMany();

        if (format === 'json') {
            return donations;
        }

        // Convert to CSV
        const headers = [
            'Donation ID', 'Status', 'Donation Date', 'Created At',
            'Blood Group', 'Urgency', 'Units', 'Health Facility',
            'Donor Name', 'Donor Email', 'Requester Name', 'Requester Email'
        ];

        const csvRows = donations.map(d => [
            d.id,
            d.status,
            d.donationDate?.toISOString() || '',
            d.createdAt.toISOString(),
            d.request.bloodGroup,
            d.request.urgency,
            d.request.units,
            d.request.healthFacility || '',
            `${d.donor.firstName} ${d.donor.lastName}`,
            d.donor.email,
            `${d.request.user.firstName} ${d.request.user.lastName}`,
            d.request.user.email
        ]);

        return [headers, ...csvRows].map(row => row.join(',')).join('\n');
    }

    async exportBloodTypeData(format: 'csv' | 'json' = 'csv') {
        const bloodTypeData = await this.getBloodTypeReport();

        if (format === 'json') {
            return bloodTypeData;
        }

        // Convert to CSV
        const headers = ['Blood Type', 'Request Count', 'Donation Count', 'Fulfillment Rate (%)'];

        const csvRows = bloodTypeData.map(data => [
            data.bloodType,
            data.requestCount,
            data.donationCount,
            data.fulfillmentRate
        ]);

        return [headers, ...csvRows].map(row => row.join(',')).join('\n');
    }

    async exportUrgencyData(format: 'csv' | 'json' = 'csv') {
        const urgencyData = await this.getUrgencyReport();

        if (format === 'json') {
            return urgencyData;
        }

        // Convert to CSV
        const headers = ['Urgency Level', 'Total Requests', 'Fulfilled Requests', 'Fulfillment Rate (%)'];

        const csvRows = urgencyData.map(data => [
            data.urgency,
            data.total,
            data.fulfilled,
            data.fulfillmentRate
        ]);

        return [headers, ...csvRows].map(row => row.join(',')).join('\n');
    }

    async exportTrendsData(format: 'csv' | 'json' = 'csv', days: number = 30) {
        const trendsData = await this.getTrendReport(days);

        if (format === 'json') {
            return trendsData;
        }

        // Convert to CSV
        const headers = ['Date', 'Requests', 'Donations', 'New Users'];

        const csvRows = trendsData.map(data => [
            data.period,
            data.requests,
            data.donations,
            data.newUsers
        ]);

        return [headers, ...csvRows].map(row => row.join(',')).join('\n');
    }
}