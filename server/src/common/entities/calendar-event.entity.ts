import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Family } from './family.entity';
import { User } from './user.entity';

export enum CalendarEventType {
  EVENT = 'EVENT',
  MAINTENANCE = 'MAINTENANCE',
  PAYMENT = 'PAYMENT',
  REMINDER = 'REMINDER',
}

@Entity('calendar_events')
export class CalendarEvent extends BaseEntity {
  @Column()
  familyId: string;

  @ManyToOne(() => Family)
  @JoinColumn({ name: 'familyId' })
  family: Family;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ default: false })
  isFullDay: boolean;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'int', default: 0 })
  reminderMinutes: number;

  @Column({
    type: 'enum',
    enum: CalendarEventType,
    default: CalendarEventType.EVENT,
  })
  type: CalendarEventType;

  @Column({ nullable: true })
  metadata: string; // JSON string for additional context (e.g., assetId, recurringId)

  @Column()
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;
}
