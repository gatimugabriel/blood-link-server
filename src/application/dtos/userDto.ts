import { Point } from "typeorm";

export interface CreateUserDto {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    bloodGroup: string;
    role?: string;
    user_source?: string;
    isVerified?: boolean;
    status?: string;
    googleId?: string;
    primaryLocation: any,
    // primaryLocation: {latitude: number, longitude: number};
    lastKnownLocation: any,
    // lastKnownLocation: {latitude: number, longitude: number};
    lastDonationDate?: Date;
}

export interface LoginUserDto {
    email: string;
    password: string;
}

export interface UserTokenDto {
    userID: string;
    token: string;
    type: string;
}

