import { User } from "../../domain/entity/User";
import mailerUtil from "../../utils/mailer";

// --- Notification Service --- //
// @desc -> sends notifications to a given list of users.
export class NotificationService {
    async sendNotification(recipients: User[], data: object): Promise<void> {
        // send notification
        const sendPromises = recipients.map(recipient => {
            mailerUtil.sendDonationRequestEmail(recipient, data)
        })
        await Promise.all(sendPromises)
        console.log("All emails sent to these donors :->", recipients)

        // TODO: Implement SMS notifications
        
    }
}
