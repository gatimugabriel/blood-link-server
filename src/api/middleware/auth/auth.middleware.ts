import { ExtendedRequest } from "../../../types/custom";
import { NextFunction, Response } from "express";
import { validateToken } from "../../../utils/token";

export const authenticate = async (
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.header('Authorization') || req.headers['authorization']
    const token = req.cookies["accessToken"] || (authHeader && authHeader.split(' ')[1]);

    if (!token) {
        res.status(401).json({
            success: false,
            message: `Missing access Token`,
        });
        return
    }

    const decoded = validateToken(token, 'ACCESS')
    if (!decoded?.userID) {        
        res.status(401).json({
            success: false,
            message: `Invalid access Token`,
        });
        return;
    }

    req.user = decoded;
    next();
}

export const validateRefreshToken = async (
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
) => {
    const token = req.cookies["refreshToken"] || req.body.refreshToken;
    if (!token) {
        res.status(401).json({
            success: false,
            message: `Missing refresh Token`,
        });
        return;
    }

    const decoded = validateToken(token, "REFRESH");
    if (!decoded) {
        res.status(401).json({
            success: false,
            message: `Invalid refresh Token`,
        });
        return;
    }

    req.user = decoded;
    next();
}