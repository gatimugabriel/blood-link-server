import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn} from "typeorm"

@Entity()
export class Notification {

    @PrimaryGeneratedColumn('uuid')
    id!: string

    @Column()
    userID!: string

    @Column()
    content!: string

    @Column({ type: "enum", enum: ["sent", "delivered", "read", "failed"], default: "sent" })
    status!: string

    @CreateDateColumn()
    createdAt!: Date

    @CreateDateColumn()
    updatedAt!: Date

    @CreateDateColumn()
    deletedAt!: Date
}
