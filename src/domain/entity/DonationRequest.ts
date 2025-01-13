import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { BloodType } from "../value-objects/bloodType";
import { User } from "./User";

@Entity()
export class DonationRequest {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    // relationship with User entity
    @ManyToOne(() => User, user => user.id, { onDelete: "CASCADE" },)
    user!: User;

    @Column({ type: "enum", enum: BloodType })
    bloodGroup!: BloodType;

    @Column({ type: "enum", enum: ["low", "medium", "high"], default: "high" })
    urgency!: string;

    @Column({ default: 2 })
    units!: number;

    @Column({ type: "enum", enum: ["open", "fulfilled", "closed"], default: "open" })
    status!: string;

    @Column({ nullable: true, type: "geometry", spatialFeatureType: "Point", srid: 4326 })
    requestLocation!: string;

    @Column({ type: "enum", enum: ["self", "other"], default: "self" })
    requestFor!: string

    @Column({ nullable: true })
    healthFacility!: string

    @Column({ nullable: true })
    patientName!: string

    @Column({ nullable: true })
    mobileNumber!: string

    @Column({ nullable: true })
    stringRequestLocation!: string

    @CreateDateColumn()
    createdAt!: Date;

    @CreateDateColumn()
    updatedAt!: Date;

    @CreateDateColumn()
    deletedAt!: Date;
}
