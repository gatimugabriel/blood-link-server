import { NextFunction, Response } from "express";
import { ReportService } from "../../application/services/reportService";
import { ExtendedRequest } from "../../types/custom";

export class ReportController {
    private readonly reportService: ReportService;

    constructor() {
        this.reportService = new ReportService();
    }

    async getDashboardStats(req: ExtendedRequest, res: Response, next: NextFunction) {
        try {
            const stats = await this.reportService.getDashboardStats();
            res.status(200).json(stats);
        } catch (error) {
            next(error);
        }
    }

    async getBloodTypeReport(req: ExtendedRequest, res: Response, next: NextFunction) {
        try {
            const report = await this.reportService.getBloodTypeReport();
            res.status(200).json(report);
        } catch (error) {
            next(error);
        }
    }

    async getTrendReport(req: ExtendedRequest, res: Response, next: NextFunction) {
        const days = parseInt(req.query.days as string) || 30;

        try {
            const trends = await this.reportService.getTrendReport(days);
            res.status(200).json(trends);
        } catch (error) {
            next(error);
        }
    }

    async getUrgencyReport(req: ExtendedRequest, res: Response, next: NextFunction) {
        try {
            const report = await this.reportService.getUrgencyReport();
            res.status(200).json(report);
        } catch (error) {
            next(error);
        }
    }

    async exportData(req: ExtendedRequest, res: Response, next: NextFunction) {
        const format = req.query.format as 'csv' | 'json' || 'csv';
        const reportType = req.query.type as string || 'donations';
        const days = req.query.days ? parseInt(req.query.days as string) : 30;

        try {
            let data;
            let filename;

            switch (reportType) {
                case 'blood-types':
                    data = await this.reportService.exportBloodTypeData(format);
                    filename = `blood_types_report.${format}`;
                    break;
                case 'urgency':
                    data = await this.reportService.exportUrgencyData(format);
                    filename = `urgency_report.${format}`;
                    break;
                case 'trends':
                    data = await this.reportService.exportTrendsData(format, days);
                    filename = `trends_report_${days}days.${format}`;
                    break;
                case 'donations':
                default:
                    data = await this.reportService.exportDonationData(format);
                    filename = `donations_report.${format}`;
                    break;
            }

            if (format === 'csv') {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
                res.status(200).send(data);
            } else {
                res.status(200).json(data);
            }
        } catch (error) {
            next(error);
        }
    }
}