import { firebaseAdmin } from "../../config/firebase/firebase.config";
import { User } from "../../domain/entity/User";
import mailerUtil from "../../utils/mailer";

// interface PushNotificationData {
//     notification: {
//         title: string;
//         body: string;
//     },
//     data: {
//         type: 'DONATION_REQUEST' | 'GENERAL' | 'CHAT';
//         additionalData?: any;
//     },
//     fcmToken: string
// }


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
            if (data.userFcmToken) {
                return this.sendFirebaseNotification(data.pushData.token, data);
            }
            return Promise.resolve();
        });


        await Promise.all([...emailPromises, ...pushPromises]);
        console.log("All emails & push-notitifcations sent to these donors :->", recipients)
        // TODO: Implement SMS notifications
    }

    async sendFirebaseNotification(fcmToken: string, data: any) {
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
            console.log('Successfully sent push notification:', response);
            return response;
        } catch (error) {
            console.error('Error sending push notification:', error);
            throw error;
        }
    }
}
