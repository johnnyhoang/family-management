import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Asset } from './asset.entity';

export enum MaintenanceStatus {
  OPEN = 'open',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}

@Entity('asset_maintenances')
@Index(['familyId', 'scheduledDate'])
@Index(['familyId', 'assetId'])
export class AssetMaintenance extends BaseEntity {
  @Column()
  familyId: string;

  @Column()
  createdBy: string;

  @Column()
  assetId: string;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'assetId' })
  asset: Asset;

  @Column({ type: 'date' })
  scheduledDate: string;

  @Column({
    type: 'enum',
    enum: MaintenanceStatus,
    default: MaintenanceStatus.OPEN,
  })
  status: MaintenanceStatus;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  cost: number | null;

  @Column({ nullable: true })
  expenseId: string | null;

  @Column({ nullable: true })
  calendarEventId: string | null;

  @Column({ type: 'int', nullable: true })
  reminderDaysBefore: number | null;
}
