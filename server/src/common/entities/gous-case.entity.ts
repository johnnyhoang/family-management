import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Family } from './family.entity';
import { GoUsMember } from './gous-member.entity';
import { GoUsDocument } from './gous-document.entity';
import { GoUsTask } from './gous-task.entity';
import { GoUsExpense } from './gous-expense.entity';

export enum GoUsStage {
  USCIS_PETITION = 'USCIS_PETITION', // Nộp đơn I-130 tại USCIS & Chờ chấp thuận
  NVC_CASE_CREATION = 'NVC_CASE_CREATION', // Chuyển NVC & Cấp Case Number / Invoice ID
  NVC_FEES = 'NVC_FEES', // Đóng phí NVC (AOS $120 & IV $345/người)
  DS260_CIVIL_DOCS = 'DS260_CIVIL_DOCS', // Khai DS-260 & Nộp hồ sơ Dân sự + Bảo trợ I-864
  NVC_DQ = 'NVC_DQ', // NVC xét duyệt & Cấp thư hoàn tất DQ
  INTERVIEW_LETTER = 'INTERVIEW_LETTER', // Nhận thư mời phỏng vấn (P4 Letter)
  MEDICAL_VACCINATION = 'MEDICAL_VACCINATION', // Khám sức khỏe & Chích ngừa
  INTERVIEW_PREP = 'INTERVIEW_PREP', // Đăng ký địa chỉ nhận visa & Chuẩn bị bộ hồ sơ PV
  INTERVIEW_CONSULATE = 'INTERVIEW_CONSULATE', // Tham gia phỏng vấn tại LSQ Hoa Kỳ (TP.HCM)
  VISA_ISSUED_USCIS_FEE = 'VISA_ISSUED_USCIS_FEE', // Nhận visa & Đóng phí thẻ xanh USCIS ($220/người)
  FLIGHT_AND_POE = 'FLIGHT_AND_POE', // Chuẩn bị bay & Nhập cảnh Hoa Kỳ (Port of Entry)
}

@Entity('gous_cases')
export class GoUsCase extends BaseEntity {
  @Index({ unique: true })
  @Column()
  familyId: string;

  @ManyToOne(() => Family, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'familyId' })
  family: Family;

  @Column({ default: 'F4 - Anh/Chị/Em công dân Mỹ' })
  visaCategory: string;

  @Column({ nullable: true })
  caseNumber: string; // HCMxxxxxxxxxx

  @Column({ nullable: true })
  invoiceId: string;

  @Column({ type: 'date', nullable: true })
  priorityDate: string; // Ngày ưu tiên (PD)

  @Column({ type: 'date', nullable: true })
  approvalDate: string; // Ngày chấp thuận I-797

  @Column({
    type: 'enum',
    enum: GoUsStage,
    default: GoUsStage.NVC_CASE_CREATION,
  })
  currentStage: GoUsStage;

  @Column({ nullable: true })
  petitionerName: string; // Tên người bảo lãnh tại Mỹ

  @Column({ nullable: true })
  petitionerAddress: string;

  @Column({ nullable: true })
  petitionerPhone: string;

  @Column({ nullable: true })
  petitionerEmail: string;

  @Column({ nullable: true })
  principalApplicantName: string; // Tên đương đơn chính (Chủ hộ)

  @Column({ type: 'text', nullable: true })
  jointSponsorInfo: string; // Người đồng bảo trợ nếu có

  @Column({ type: 'timestamp', nullable: true })
  interviewDate: Date; // Ngày & giờ phỏng vấn tại LSQ

  @Column({ type: 'date', nullable: true })
  medicalExamDate: string; // Ngày khám sức khỏe

  @Column({ type: 'date', nullable: true })
  vaccinationDate: string; // Ngày tiêm chủng

  @Column({ type: 'date', nullable: true })
  intendedDepartureDate: string; // Ngày dự kiến bay

  @Column({ nullable: true })
  destinationAddress: string; // Địa chỉ cư trú tại Mỹ

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => GoUsMember, (member) => member.case, { cascade: true })
  members: GoUsMember[];

  @OneToMany(() => GoUsDocument, (doc) => doc.case, { cascade: true })
  documents: GoUsDocument[];

  @OneToMany(() => GoUsTask, (task) => task.case, { cascade: true })
  tasks: GoUsTask[];

  @OneToMany(() => GoUsExpense, (expense) => expense.case, { cascade: true })
  expenses: GoUsExpense[];
}
