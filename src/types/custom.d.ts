import {Request} from "express"

interface ExtendedRequest extends Request {
    user?: {
        userID: string;
        userRole?: string
        email?: string,
        userName?: string
    };
}
