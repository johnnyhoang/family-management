import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { GoUsCase } from './gous-case.entity';

export enum ExpenseCategory {
  NVC_GOVERNMENT_FEE = 'NVC_GOVERNMENT_FEE', // Phí NVC chính phủ (AOS, DS-260)
  MEDICAL_AND_VACCINE = 'MEDICAL_AND_VACCINE', // Khám sức khỏe & Tiêm vắc xin
  CIVIL_AND_LEGAL_DOCS = 'CIVIL_AND_LEGAL_DOCS', // Dịch thuật, công chứng, làm hộ chiếu, LLTP số 2
  USCIS_IMMIGRANT_FEE = 'USCIS_IMMIGRANT_FEE', // Phí cấp thẻ xanh $220/người
  FLIGHT_AND_LOGISTICS = 'FLIGHT_AND_LOGISTICS', // Vé máy bay, hành lý, di chuyển
  SETTLEMENT_FUNDS = 'SETTLEMENT_FUNDS', // Tiền mặt & tài chính mang theo dự phòng
  OTHER = 'OTHER',
}

export enum ExpensePaymentStatus {
  ESTIMATED = 'ESTIMATED', // Mới dự toán
  PAID = 'PAID', // Đã thanh toán
  UNPAID = 'UNPAID', // Cần thanh toán
}

@Entity('gous_expenses')
export class GoUsExpense extends BaseEntity {
  @Column()
  caseId: string;

  @ManyToOne(() => GoUsCase, (gCase) => gCase.expenses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caseId' })
  case: GoUsCase;

  @Column({
    type: 'enum',
    enum: ExpenseCategory,
    default: ExpenseCategory.NVC_GOVERNMENT_FEE,
  })
  category: ExpenseCategory;

  @Column()
  title: string;

  @Column({ default: 'USD' })
  currency: string; // 'USD' hoặc 'VND'

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  estimatedAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  actualAmount: number;

  @Column({
    type: 'enum',
    enum: ExpensePaymentStatus,
    default: ExpensePaymentStatus.ESTIMATED,
  })
  status: ExpensePaymentStatus;

  @Column({ type: 'date', nullable: true })
  paymentDate: string;

  @Column({ nullable: true })
  payer: string; // Người chi trả (vd: 'Người bảo lãnh tại Mỹ' | 'Gia đình Việt Nam')

  @Column({ type: 'text', nullable: true })
  notes: string;
}
