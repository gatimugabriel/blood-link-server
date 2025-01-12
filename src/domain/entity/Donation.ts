import {Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Unique} from "typeorm"
import {DonationRequest} from "./DonationRequest";
import {User} from "./User";

@Entity()
@Unique(["donor", "status"])
export class Donation {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => DonationRequest, request => request.id, {onDelete: "CASCADE"})
    request!: DonationRequest;

    @ManyToOne(() => User, donor => donor.id, {onDelete: "CASCADE"})
    @Index()
    donor!: User;

    @Column({type: "enum", enum: ["scheduled", "completed", "cancelled"], default: "scheduled"})
    @Index()
    status!: string;

    @Column()
    donationDate!: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @CreateDateColumn()
    updatedAt!: Date;

    @CreateDateColumn()
    deletedAt!: Date;
}
