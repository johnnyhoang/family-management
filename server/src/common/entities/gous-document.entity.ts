import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { GoUsCase } from './gous-case.entity';
import { GoUsMember } from './gous-member.entity';

export enum DocumentCategory {
  CIVIL_IDENTITY = 'CIVIL_IDENTITY', // Giấy tờ tùy thân & Dân sự (Khai sinh, Kết hôn, LLTP2...)
  FINANCIAL_SUPPORT = 'FINANCIAL_SUPPORT', // Bảo trợ tài chính I-864 (Thuế 3 năm, W2, Việc làm...)
  RELATIONSHIP_PROOF = 'RELATIONSHIP_PROOF', // Bằng chứng quan hệ huyết thống anh chị em ruột F4
  MEDICAL_VACCINE = 'MEDICAL_VACCINE', // Khám sức khỏe, Phiếu tiêm chủng
  INTERVIEW_TRAVEL = 'INTERVIEW_TRAVEL', // Giấy tờ mang đi phỏng vấn, Đăng ký địa chỉ visa, Vé máy bay
  OTHER = 'OTHER',
}

export enum DocumentStatus {
  NOT_PREPARED = 'NOT_PREPARED', // Chưa chuẩn bị
  ORIGINAL_OBTAINED = 'ORIGINAL_OBTAINED', // Đã có bản gốc
  TRANSLATED_NOTARIZED = 'TRANSLATED_NOTARIZED', // Đã dịch thuật công chứng tiếng Anh
  SUBMITTED_NVC = 'SUBMITTED_NVC', // Đã nộp lên CEAC (NVC)
  READY_FOR_INTERVIEW = 'READY_FOR_INTERVIEW', // Đã sẵn sàng mang đi phỏng vấn
  EXPIRED = 'EXPIRED', // Đã hết hạn (Cần làm lại)
}

@Entity('gous_documents')
export class GoUsDocument extends BaseEntity {
  @Column()
  caseId: string;

  @ManyToOne(() => GoUsCase, (gCase) => gCase.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caseId' })
  case: GoUsCase;

  @Column({ nullable: true })
  memberId: string; // Nếu giấy tờ thuộc 1 thành viên cụ thể

  @ManyToOne(() => GoUsMember, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'memberId' })
  member: GoUsMember;

  @Column({
    type: 'enum',
    enum: DocumentCategory,
    default: DocumentCategory.CIVIL_IDENTITY,
  })
  category: DocumentCategory;

  @Column()
  title: string; // Tên giấy tờ

  @Column({ type: 'text', nullable: true })
  description: string; // Hướng dẫn chi tiết / Yêu cầu quy cách

  @Column({ type: 'boolean', default: true })
  isRequired: boolean; // Bắt buộc hay Tự chọn

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.NOT_PREPARED,
  })
  status: DocumentStatus;

  @Column({ type: 'date', nullable: true })
  issueDate: string; // Ngày cấp

  @Column({ type: 'date', nullable: true })
  expiryDate: string; // Ngày hết hạn

  @Column({ nullable: true })
  fileUrl: string; // Link file đính kèm nếu có

  @Column({ type: 'text', nullable: true })
  expertNotes: string; // Lưu ý quan trọng từ luật sư / chuyên viên
}
