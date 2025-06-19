import {UserService} from "./userService";
import {UserRepository} from "../../domain/repositories/userRepository";
import {DonationRepository} from "../../domain/repositories/donationRepository";
import {users} from "../../infrastructure/database/data/users";
import {donationRequests} from "../../infrastructure/database/data/donationRequests";
import {User} from "../../domain/entity/User";
import {DonationRequest} from "../../domain/entity/DonationRequest";
import {Donation} from "../../domain/entity/Donation";
import {createPoint} from "../../utils/database";
import {DonationService} from "./donationService";

export class DataSeedingService {
    private userService: UserService;
    private donationService: DonationService;
    private readonly userRepository: UserRepository;
    private readonly donationRepository: DonationRepository;

    constructor() {
        this.userRepository = new UserRepository();
        this.donationRepository = new DonationRepository();
        this.userService = new UserService(this.userRepository);
        this.donationService = new DonationService(this.donationRepository, this.userRepository);
    }

    async seedUsers(): Promise<User[]> {
        const createdUsers: User[] = [];
        
        for (const userData of users) {
            try {
                const user = await this.userService.createUser(userData);
                createdUsers.push(user);
            } catch (error) {
                console.error(`Failed to create user ${userData.email}:`, error);
            }
        }
        
        return createdUsers;
    }

    async seedDonationRequests(): Promise<DonationRequest[]> {
        const [users] = await this.userRepository.listUsers({});
        const createdRequests: DonationRequest[] = [];
        
        if (users.length === 0) {
            throw new Error('No users found. Please seed users first.');
        }

        for (let i = 0; i < donationRequests.length; i++) {
            try {
                const requestData = donationRequests[i];
                const user = users[i % users.length]; // Distribute requests among users
                
                const requestLocationPoint = createPoint(
                    requestData.requestLocation.latitude,
                    requestData.requestLocation.longitude
                );

                const donationRequest = new DonationRequest();
                Object.assign(donationRequest, {
                    ...requestData,
                    user: user,
                    requestLocation: requestLocationPoint,
                    requestingFor: requestData.requestFor
                });

                const savedRequest = await this.donationRepository.createDonationRequest(donationRequest);
                createdRequests.push(savedRequest);
            } catch (error) {
                console.error(`Failed to create donation request ${i}:`, error);
            }
        }
        
        return createdRequests;
    }

    // Seed donations (schedule and complete some donations)
    async seedDonations(): Promise<Donation[]> {
        // Get all open donation requests
        const [requests] = await this.donationRepository.findDonationRequests(0, 100);
        const [users] = await this.userRepository.listUsers({});
        const createdDonations: Donation[] = [];
        
        if (requests.length === 0) {
            throw new Error('No donation requests found. Please seed donation requests first.');
        }

        if (users.length === 0) {
            throw new Error('No users found. Please seed users first.');
        }

        // Create some scheduled donations
        for (let i = 0; i < Math.min(requests.length, 5); i++) {
            try {
                const request = requests[i];
                const donor = users.find(user => 
                    user.id !== request.user.id && 
                    user.bloodGroup === request.bloodGroup
                );
                
                if (!donor) continue;

                const donation = new Donation();
                donation.donor = donor;
                donation.request = request;
                donation.status = 'scheduled';
                donation.donationDate = new Date();

                const savedDonation = await this.donationRepository.createDonation(donation);
                createdDonations.push(savedDonation);
            } catch (error) {
                console.error(`Failed to create donation ${i}:`, error);
            }
        }

        // Complete some donations
        for (let i = 0; i < Math.min(createdDonations.length, 3); i++) {
            try {
                createdDonations[i] = await this.donationService.completeDonation(createdDonations[i].id);
            } catch (error) {
                console.error(`Failed to complete donation ${i}:`, error);
            }
        }

        return createdDonations;
    }

    // Complete all seeding in one go
    async seedAllData(): Promise<{
        users: User[];
        requests: DonationRequest[];
        donations: Donation[];
    }> {
        console.log('Starting data seeding...');
        
        const users = await this.seedUsers();
        console.log(`Created ${users.length} users`);
        
        const requests = await this.seedDonationRequests();
        console.log(`Created ${requests.length} donation requests`);
        
        const donations = await this.seedDonations();
        console.log(`Created ${donations.length} donations`);
        
        console.log('Data seeding completed!');
        
        return { users, requests, donations };
    }
} 