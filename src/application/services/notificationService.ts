import { User } from "../../domain/entity/User";
import mailerUtil from "../../utils/mailer";

// --- Notification Service --- //
// @desc -> sends notifications to a given list of users.
export class NotificationService {
    async sendNotification(recipients: User[], data: any): Promise<void> {
        // send email notifications
        const emailPromises = recipients.map(recipient => {
            // mailerUtil.sendDonationRequestEmail(recipient, data)
            console.log("");
        })

        // send push notifications
        const pushPromises = recipients.map(recipient => {
            if (recipient.tokens.length > 0) {
                const fcmToken = recipient.tokens[0]
                return this.sendExpoPushNotification(fcmToken, data);
            }
            return Promise.resolve();
        });

        if (Array.isArray(recipients)) {
            for (const recipient of recipients) {
                if (recipient.tokens && recipient.tokens.length > 0) {
                    for (const token of recipient.tokens) {
                        pushPromises.push(this.sendExpoPushNotification(token, data));
                    }
                }
            }
        }

        await Promise.all([...emailPromises, ...pushPromises]);
        console.log("All emails & push-notifications sent!")
        // TODO: Implement SMS notifications
    }

    async sendExpoPushNotification(fcmToken: any, data: any) {
        try {
            let messageTitle = data.title || 'Blood Link Notification';
            let messageBody = typeof data === 'string' ? data : data.subTitle || 'New notification';
            let messageData = typeof data === 'string'
                ? {
                    message: data,
                    type: "NOTIFICATION",
                    id: Date.now().toString()
                }
                : {
                    type: "DONATION_REQUEST",
                    id: data.id || Date.now().toString(),
                    ...(data.body || {})
                };

            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: fcmToken,
                    title: messageTitle,
                    body: messageBody,
                    sound: 'default',
                    badge: 1,
                    data: messageData,
                }),
            });

            // const responseData = await response.json();
            // console.log('Successfully sent expo push notification:', responseData);
            return response;
        } catch (error) {
            console.error('Error sending expo push notification:', error);
            throw error;
        }
    }
}
