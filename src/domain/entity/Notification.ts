import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn} from "typeorm"

@Entity()
export class Notification {

    @PrimaryGeneratedColumn('uuid')
    id!: string

    @Column()
    userID!: string

    @Column()
    content!: string

    @Column({ nullable: true })
    requestID!: string

    @Column({ nullable: true })
    bloodGroup!: string

    @Column({ nullable: true })
    urgency!: string

    @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
    latitude!: number

    @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
    longitude!: number

    @Column({ type: "enum", enum: ["sent", "delivered", "read", "failed"], default: "sent" })
    status!: string

    @CreateDateColumn()
    createdAt!: Date

    @CreateDateColumn()
    updatedAt!: Date

    @CreateDateColumn()
    deletedAt!: Date
}
