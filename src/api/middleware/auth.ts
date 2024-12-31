import { ExtendedRequest } from "../../types/custom";
import { NextFunction, Response } from "express";
import jwt from 'jsonwebtoken'
import { decryptPayload } from "../../utils/encryption";

export const verifyToken = (tokenType: string) => {
    return (req: ExtendedRequest, res: Response, next: NextFunction) => {
        if (!process.env["JWT_SECRET_ACCESS_TOKEN"] || !process.env["JWT_SECRET_REFRESH_TOKEN"]) {
            throw new Error('token secret not provided');
        }

        let tokenString: string
        let tokenSecret: string

        switch (tokenType) {
            case 'access':
                const authHeader = req.header('Authorization') || req.headers['authorization'] as string
                tokenString = req.cookies['accessToken'] || authHeader && authHeader.split(' ')[1]
                tokenSecret = process.env["JWT_SECRET_ACCESS_TOKEN"]
                break
            case 'refresh':
                const { refreshToken } = req.body
                tokenString = req.cookies['refreshToken'] || refreshToken
                tokenSecret = process.env["JWT_SECRET_REFRESH_TOKEN"]
                break
            default:
                throw new Error('Invalid token type')
        }

        if (!tokenString || tokenString === "") {
            res.status(401).json({
                success: false,
                message: "Missing Token",
            });
            return
        }

        jwt.verify(
            tokenString,
            tokenSecret,
            (err: any, decoded: any) => {
                if (err) {
                    res.status(401).json({
                        success: false,
                        message: "Invalid Token",
                        type: `INVALID_${tokenType}_TOKEN`
                    });
                    return
                }
                //  else {
                //     //  decrypt payload data
                //     const decryptedPayload = decryptPayload(decoded["data"])
                //     req.user = decryptedPayload
                //     next()
                // }

                if (!decoded || !decoded.data) {
                    return res.status(401).json({
                        success: false,
                        message: "Invalid token payload",
                    });
                }

                try {
                    //  decrypt payload data
                    req.user = decryptPayload(decoded["data"])
                    next()
                } catch (decryptError: any) {
                    return res.status(401).json({
                        success: false,
                        message: "Failed to decrypt token payload",
                        error: decryptError.message
                    });
                }
            }
        );
    }
}
