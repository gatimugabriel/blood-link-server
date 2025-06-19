import jwt from "jsonwebtoken";
import {authConfig} from '../application/config/auth.config';
import {encryptPayload, decryptPayload} from "./encryption";

const accessTokenSecret = authConfig.jwt.accessTokenSecret as string
const refreshTokenSecret = authConfig.jwt.refreshTokenSecret as string
const passwordResetTokenSecret = authConfig.jwt.passwordResetTokenExpiry as string

// Generates a JWT token
export function generateToken(payload: any, secretKey: string, expiresIn: string): string {
    const encryptedPayload = encryptPayload(payload)
    return jwt.sign({data: encryptedPayload}, secretKey, {expiresIn});
}

export function validateToken(tokenString: string, tokenType: string): any {
    let secret: string;

    switch (tokenType) {
        case "ACCESS":
            secret = accessTokenSecret
            break;
        case "REFRESH":
            secret = refreshTokenSecret;
            break;
        case 'PASSWORD_RESET':
            secret = passwordResetTokenSecret
            break;
        default:
            throw new Error('Invalid token type');
    }

    try {
        const token = jwt.verify(tokenString, secret) as jwt.JwtPayload;
        const encryptedPayload = token.data as string;
        return decryptPayload(encryptedPayload);
    } catch (err) {
        // throw new Error(`${tokenType} Token Validation Failed`)
        return err
    }
}

// Generates auth tokens
export function generateAuthTokens(userID: number | string, userRole: string, email = ""): { accessToken: string; refreshToken: string } {
    const userPayload = {userID, userRole, email};
    if (!authConfig.jwt.accessTokenSecret || !authConfig.jwt.refreshTokenSecret) {
        throw new Error('JWT secrets are not provided');
    }
    const accessExpiry = authConfig.jwt.accessTokenExpiry as string
    const refreshExpiry = authConfig.jwt.refreshTokenExpiry as string

    const accessToken = generateToken(userPayload, accessTokenSecret, accessExpiry);
    const refreshToken = generateToken(userPayload, refreshTokenSecret, refreshExpiry);

    return {accessToken, refreshToken};
}