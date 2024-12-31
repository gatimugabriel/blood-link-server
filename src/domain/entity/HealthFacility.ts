import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn} from "typeorm"

@Entity()
export class HealthFacility {

    @PrimaryGeneratedColumn('uuid')
    id!: string

    @Column()
    name!: string

    @Column()
    location!: string

    @Column({ nullable: false, unique: true })
    phone!: string

    @Column({ nullable: false, unique: true })
    email!: string

    @CreateDateColumn()
    createdAt!: Date

    @CreateDateColumn()
    updatedAt!: Date

    @CreateDateColumn()
    deletedAt!: Date
}
