import { NextFunction, Request, Response } from "express";
import { QueryFailedError } from "typeorm";

const notFound = (req: Request, res: Response, next: NextFunction) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
}

const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = error?.customMessage || error.message || 'Server Error Occurred. Try again later';

    // DB errors -> raised by TYPEORM
    if (error instanceof QueryFailedError) {
        const err = error as any;
        switch (err.code) {
            case "23505": // unique constraint violation
                statusCode = 409;
                message = `Duplicate value for field: ${err.detail.match(/\(([^)]+)\)/)[1]}`;
                break;
            case '23503': // foreign key violation
                statusCode = 404;
                message = `Related record not found for field: ${err.detail.match(/\(([^)]+)\)/)[1]}`;
                break;
            case '23502': // not null violation
                statusCode = 400;
                message = `Field cannot be null: ${err.detail.match(/\(([^)]+)\)/)[1]}`;
                break
            case '22P02': // invalid input syntax for type
                statusCode = 400;
                console.log(err);
                
                message = `Invalid input syntax for type: ${err.detail.match(/\(([^)]+)\)/)[1]}`;
                break;
            default:
                statusCode = 500;
                message = 'Internal server error';
        }
    }

    if (message.includes('Invalid')) {
        statusCode = 400
    }

    if (message.includes('Invalid credentials')) {
        statusCode = 401
    }

    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack,
    });
}

export default { notFound, errorHandler };
