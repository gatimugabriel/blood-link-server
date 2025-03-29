import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { NextFunction, Response } from 'express';
import crypto from 'crypto';
import { mailConfig } from "../application/config/mail.config";
import { ExtendedRequest } from "../types/custom";
import { User } from "../domain/entity/User";

dotenv.config();

// -- transport config -- //
const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

const sendMail = async (to: string, subject: string, htmlBody: string) => {
    const mailOptions = {
        from: mailConfig.EMAIL_SENDER,
        to,
        subject,
        html: htmlBody,
    };

    try {
        return await transport.sendMail(mailOptions);
    } catch (error) {
        console.log('Error occurred', error);
        throw new Error('Failed to send email. Try again later');
    }
};

const sendVerificationEmail = async ({ userName, email, token }: { userName: string; email: string; token: string }) => {
    const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #e63946; text-align: center;">Please Confirm Your Account</h1>
            <h2 style="color: #333;">Hello ${userName},</h2>
            <p style="font-size: 16px; color: #333;">
                Thank you for joining Blood-Link! Please confirm your email by clicking the link below:
            </p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="${process.env["MOBILE_CLIENT_ORIGIN"]}/auth/verify/${token}" 
                   style="background-color: #e63946; color: white; padding: 12px 20px; text-decoration: none; font-size: 16px; border-radius: 5px;">
                   Verify Your Account
                </a>
            </div>
            <p style="font-size: 14px; color: #777;">
                If you didn't request this, please ignore this email.
            </p>
            <p style="font-size: 14px; color: #333;">
                Regards,<br>
                The Blood-Link Team
            </p>
        </div>
    </div>
    `;
    return sendMail(email, 'Email Verification', htmlBody);
};

const sendResetPassword = async ({ userName, email, token }: { userName: string; email: string; token: string }) => {
    const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #e63946; text-align: center;">Reset Your Password</h1>
            <h2 style="color: #333;">Hello ${userName},</h2>
            <p style="font-size: 16px; color: #333;">
                You are receiving this email because a request to reset your password for your Blood-Link account was made.
            </p>
            <p style="font-size: 16px; color: #333;">
                Click the link below to reset your password:
            </p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="${process.env["MOBILE_CLIENT_ORIGIN"]}/auth/reset-password/${token}" 
                   style="background-color: #e63946; color: white; padding: 12px 20px; text-decoration: none; font-size: 16px; border-radius: 5px;">
                   Reset Password
                </a>
            </div>
            <p style="font-size: 14px; color: #777;">
                If you did not request this, you can safely ignore this email.
            </p>
            <p style="font-size: 14px; color: #333;">
                Regards,<br>
                The Blood-Link Team
            </p>
        </div>
    </div>
    `;
    return sendMail(email, 'Password Reset Request', htmlBody);
};

const resendEmailToUnverifiedUser = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    const { user } = req

    console.log('reverifying')
    // delete old verification tokens
    // await Token.deleteMany({
    //     where: {user_id: user?.id as number, action: "EMAIL_VERIFICATION"},
    // });

    // verification code
    const verificationCode = crypto.randomBytes(20).toString('hex');
    // const newToken = await Token.create({
    //     data: {
    //         userID: user?.userId as number,
    //         token: verificationCode,
    //         action: 'EMAIL_VERIFICATION',
    //         expires: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours
    //     },
    // });
    const newToken = { token: verificationCode }

    // send email
    await sendVerificationEmail({
        userName: user?.userName as string,
        email: user?.email as string,
        token: newToken.token,
    });

    res.status(201).json({
        message: 'Verification email sent to your inbox. Check your email to verify your account first',
    });
}

// --  DONATIONS -- //
// Donation Request
const sendDonationRequestEmail = async (recipient: User, messageData: any) => {
    const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #e63946; text-align: center;">New Donation Request Nearby!</h1>
            <h2 style="color: #333;">Hello ${recipient.firstName},</h2>
            <p style="font-size: 16px; color: #333;">
                We have a new donation request that needs your help. Here are the details:
            </p>
            <ul style="font-size: 16px; color: #333; list-style: none; padding: 0;">
                <li><strong>Urgency:</strong> ${messageData.body.urgency}</li>
                <li><strong>Location:</strong> ${messageData.body.location.latitude}, ${messageData.body.location.longitude}</li>
                <li><strong>Blood Group:</strong> ${messageData.body.bloodGroup}</li>
            </ul>
            <div style="text-align: center; margin: 20px 0;">
                <a href="${process.env["MOBILE_CLIENT_ORIGIN"]}/donations/donate/confirm-availability" 
                   style="background-color: #e63946; color: white; padding: 12px 20px; text-decoration: none; font-size: 16px; border-radius: 5px;">
                   Confirm Your Availability
                </a>
            </div>
            <p style="font-size: 14px; color: #333;">
                Thank you for being a part of Blood-Link and helping save lives!
            </p>
        </div>
    </div>
    `;
    await sendMail(recipient.email, messageData.title, htmlBody);
};

const mailerUtil = {
    sendVerificationEmail,
    sendResetPassword,
    resendEmailToUnverifiedUser,
    sendDonationRequestEmail
};

export default mailerUtil;
