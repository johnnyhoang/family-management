import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum FamilyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity('families')
export class Family extends BaseEntity {
  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: FamilyStatus,
    default: FamilyStatus.ACTIVE,
  })
  status: FamilyStatus;
}
