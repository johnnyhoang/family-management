import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { GoUsCase, GoUsStage } from './gous-case.entity';

export enum TaskPriority {
  URGENT = 'URGENT', // Khẩn cấp (Phải làm ngay)
  HIGH = 'HIGH', // Ưu tiên cao
  MEDIUM = 'MEDIUM', // Trung bình
  LOW = 'LOW', // Thấp
}

export enum TaskStatus {
  TODO = 'TODO', // Chưa làm
  IN_PROGRESS = 'IN_PROGRESS', // Đang thực hiện
  DONE = 'DONE', // Đã hoàn thành
  SKIPPED = 'SKIPPED', // Bỏ qua / Không áp dụng
}

@Entity('gous_tasks')
export class GoUsTask extends BaseEntity {
  @Column()
  caseId: string;

  @ManyToOne(() => GoUsCase, (gCase) => gCase.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caseId' })
  case: GoUsCase;

  @Column({
    type: 'enum',
    enum: GoUsStage,
    default: GoUsStage.NVC_CASE_CREATION,
  })
  stage: GoUsStage;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Column({ type: 'date', nullable: true })
  dueDate: string;

  @Column({ nullable: true })
  assignedTo: string; // Tên người phụ trách trong gia đình

  @Column({ type: 'boolean', default: false })
  isSystemSuggested: boolean; // Gợi ý mặc định từ chuyên gia

  @Column({ type: 'text', nullable: true })
  expertTips: string; // Lời khuyên của chuyên viên / luật sư
}
