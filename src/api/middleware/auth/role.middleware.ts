import { Response, NextFunction } from 'express';
import { ExtendedRequest } from "../../../types/custom";

type RoleType = 'ADMIN' | 'USER';

export const hasRoles = (allowedRoles: RoleType[]) => {
    return async (
        req: ExtendedRequest,
        res: Response,
        next: NextFunction
    ) => {
        if (!req.user) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(401).json({
                    success: false,
                    message: 'Login First!'
                });
            } else {
                return res.redirect('/admin/login');
            }
        }

        if (!allowedRoles.includes(req.user.userRole?.toUpperCase() as RoleType)) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions'
                });
            } else {
                return res.render('admin/error', {
                    title: 'Access Denied',
                    message: 'You do not have permission to access this page'
                });
            }
        }

        next();
    }
};

export const isAdmin = hasRoles(['ADMIN']);