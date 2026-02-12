import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Asset } from './asset.entity';

export enum ExpenseType {
  PURCHASE = 'PURCHASE',
  MAINTENANCE = 'MAINTENANCE',
  REPAIR = 'REPAIR',
  ELECTRICITY = 'ELECTRICITY',
  WATER = 'WATER',
  INTERNET = 'INTERNET',
  GAS = 'GAS',
  RENT = 'RENT',
  TAX = 'TAX',
  INSURANCE = 'INSURANCE',
  SUBSCRIPTION = 'SUBSCRIPTION',
  DEPRECIATION = 'DEPRECIATION',
  OTHER = 'OTHER',
}

export enum RecurringCycle {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

@Entity('expenses')
export class Expense extends BaseEntity {
  @Column()
  familyId: string;

  @Column({ nullable: true })
  assetId: string;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'assetId' })
  asset: Asset;

  @Column({
    type: 'enum',
    enum: ExpenseType,
    default: ExpenseType.OTHER,
  })
  type: ExpenseType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ default: 'VND' })
  currency: string;

  @Column({ type: 'date' })
  expenseDate: Date;

  @Column({ default: false })
  isRecurring: boolean;

  @Column({
    type: 'enum',
    enum: RecurringCycle,
    nullable: true,
  })
  recurringCycle: RecurringCycle;

  @Column({ type: 'date', nullable: true })
  nextOccurrenceDate: Date;

  @Column({ default: false })
  reminderEnabled: boolean;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'json', nullable: true })
  customFields: any;

  @Column()
  createdBy: string;
}
