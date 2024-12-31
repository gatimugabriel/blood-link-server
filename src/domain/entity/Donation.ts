        import {Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm"
        import {DonationRequest} from "./DonationRequest";

        @Entity()
        export class Donation {

            @PrimaryGeneratedColumn('uuid')
            id!: string;

            @Column()
            donorID!: string;

            @Column()
            @ManyToOne(() => DonationRequest, request => request.id, { onDelete: "CASCADE" })
            requestID!: string;

            @Column({ type: "enum", enum: ["scheduled", "completed", "cancelled"], default: "scheduled" })
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
