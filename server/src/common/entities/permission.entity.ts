import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from './user.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({ nullable: true })
  familyId: string;

  @Column()
  moduleId: string;

  @Column({ nullable: true })
  categoryId: string;

  @Column({ default: false })
  canView: boolean;

  @Column({ default: false })
  canAdd: boolean;

  @Column({ default: false })
  canEdit: boolean;

  @Column({ default: false })
  canDelete: boolean;

  @Column({ default: false })
  canNotify: boolean;
}
