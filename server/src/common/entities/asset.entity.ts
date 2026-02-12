import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Category } from './category.entity';
import { User } from './user.entity';

export enum AssetStatus {
  ACTIVE = 'ACTIVE',
  BROKEN = 'BROKEN',
  SOLD = 'SOLD',
  LOST = 'LOST',
  ARCHIVED = 'ARCHIVED',
}

@Entity('assets')
export class Asset extends BaseEntity {
  @Column()
  familyId: string;

  @Column()
  categoryId: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ nullable: true })
  parentAssetId: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date', nullable: true })
  purchaseDate: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  purchasePrice: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  currentValue: number;

  @Column({ type: 'date', nullable: true })
  warrantyExpiredAt: Date;

  @Column({ nullable: true })
  serialNumber: string;

  @Column({
    type: 'enum',
    enum: AssetStatus,
    default: AssetStatus.ACTIVE,
  })
  status: AssetStatus;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  assignedToUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assignedToUserId' })
  assignedToUser: User;

  @Column({ type: 'json', nullable: true })
  images: string[];

  @Column({ type: 'json', nullable: true })
  documents: string[];

  @Column({ type: 'json', nullable: true })
  customFields: any;

  @Column()
  createdBy: string;
}
