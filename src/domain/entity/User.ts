import {Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique} from "typeorm"
import {BloodType} from "../value-objects/bloodType";
import {DonationRequest} from "./DonationRequest";

@Entity()
export class User {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({nullable: false})
    firstName!: string;

    @Column()
    lastName!: string;

    @Column({unique: true, nullable: false})
    email!: string;

    @Column({unique: true, nullable: false})
    phone!: string;

    @Column()
    password!: string;

    @Column({type: "enum", enum: BloodType})
    bloodGroup!: BloodType;

    @Column({type: "enum", enum: ["user", "admin"], default: "user"})
    role!: string;

    @Column({type: "enum", enum: ["google", "email"], default: "email"})
    user_source!: string;

    @Column({default: false})
    isVerified!: boolean;

    @Column({type: "enum", enum: ["active", "inactive"], default: "active"})
    status!: string;

    @Column({nullable: true})
    googleId!: string;

    @Column({type: "geometry", spatialFeatureType: "Point", srid: 4326})
    primaryLocation!: string;

    @Column({type: "geometry", spatialFeatureType: "Point", srid: 4326})
    lastKnownLocation!: string;

    @Column({nullable: true})
    lastDonationDate!: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @CreateDateColumn()
    updatedAt!: Date;

    @CreateDateColumn()
    deletedAt!: Date;

      //---  Relations ---//
    // User --> Token
    @OneToMany(() => Token, token => token.user)
    tokens!: Token[];

    // User --> Donation Requests (One user can have many donation requests)
    @OneToMany(() => DonationRequest, donationRequest => donationRequest.user)
    donationRequests!: DonationRequest[];
}

/* User Token */
@Entity()
@Unique(["userID", "token", "type"])
export class Token {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({type: 'uuid'})
    userID!: string;

    @Column()
    token!: string;

    @Column({type: "enum", enum: ["refresh", "verification", "password_reset", "fcm"], default: "refresh"})
    type!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @CreateDateColumn()
    updatedAt!: Date;

    //--- Relations ---//
    //  Token --> User
    @ManyToOne(() => User, user => user.tokens)
    @JoinColumn({name: "userID"})
    user!: User;
}

