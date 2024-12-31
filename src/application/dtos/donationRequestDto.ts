export interface CreateDonationRequestDto {
    userId: string; // requester
    bloodGroup: string;
    units: number
    urgency: string;
    status: string;
    requestLocation: any;

    healthFacility?: any;
    patientName?: string;
    mobileNumber?: string;
    gender?: string

    requestingFor?: string // Defaults to 'self' 
}
