import {DonationRequest} from "../entity/DonationRequest";
import {Donation} from "../entity/Donation";
import {User} from "../entity/User";

export class DonationAggregate {
    constructor(
        public donationRequest: DonationRequest,
        public donation: Donation | null,
        public donor: User | null,
        public recipient: User | null
    ) {
    }

    //  Check if a potential donor can fulfill a donation request
    canFulfillDonationRequest(potentialDonor: User): boolean {
        if (this.donation) {
            return false; // already fulfilled
        }

        // blood group mismatch TODO: to fix here
        // if (potentialDonor.bloodGroup !== this.donationRequest.bloodGroup) {
        //     return false;
        // }

        // Donor has donated within the last 56 days
        if (potentialDonor.lastDonationDate &&
            (new Date().getTime() - potentialDonor.lastDonationDate.getTime()) < 56 * 24 * 60 * 60 * 1000) {
            return false;
        }

        // Check if the user has an open donation request
        // if (potentialDonor.hasOpenRequest) {
        //     return false; // User needs blood, not giving it
        // }

        return true
    }

    fulfillDonationRequest(donor: User): void {
        if (!this.canFulfillDonationRequest(donor)) {
            throw new Error("Donor cannot fulfill donation request");
        }
        this.donation = new Donation();
        this.donation.donorID = donor.id;
        this.donation.requestID = this.donationRequest.id;
        this.donation.status = "scheduled";
        this.donor = donor;
    }
}
