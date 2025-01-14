import {firebaseAdmin} from "../../config/firebase/firebase.config";
import {User} from "../../domain/entity/User";
import mailerUtil from "../../utils/mailer";

// --- Notification Service --- //
// @desc -> sends notifications to a given list of users.
export class NotificationService {
    async sendNotification(recipients: User[], data: any): Promise<void> {
        // send email notifications
        const emailPromises = recipients.map(recipient => {
            mailerUtil.sendDonationRequestEmail(recipient, data)
        })

        // send push notifications with Firebase
        const pushPromises = recipients.map(recipient => {
            if (recipient.tokens.length > 0) {
                const fcmToken = recipient.tokens[0]
                return this.sendExpoPushNotification(fcmToken, data);
            }
            return Promise.resolve();
        });

        await Promise.all([...emailPromises, ...pushPromises]);
        console.log("All emails & push-notifications sent!")
        // TODO: Implement SMS notifications
    }

    async sendExpoPushNotification(fcmToken: any, data: any) {
        try {
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: fcmToken,
                    title: data.title,
                    body: data.subTitle,
                    data: {
                        type: "DONATION_REQUEST",
                        ...data.body
                    },
                }),
            });

            const responseData = await response.json();
            console.log('Successfully sent expo push notification:', responseData);
            return response;
        } catch (error) {
            console.error('Error sending expo push notification:', error);
            throw error;
        }
    }

    async sendFirebasePushNotification(fcmToken: string, data: any) {
        try {
            const message = {
                notification: {
                    title: data.title,
                    body: data.subTitle
                },
                data: {
                    type: "DONATION_REQUEST",
                    ...data.body
                },
                token: fcmToken
            }

            const response = await firebaseAdmin.messaging().send(message);
            console.log('Successfully sent firebase push notification:', response);
            return response;
        } catch (error) {
            console.error('Error sending firebase push notification:', error);
            throw error;
        }
    }
}
