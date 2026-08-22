import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ExpenseCategory, ExpensePaymentStatus } from '../../../common/entities/gous-expense.entity';

export class CreateGoUsExpenseDto {
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  estimatedAmount?: number;

  @IsOptional()
  @IsNumber()
  actualAmount?: number;

  @IsOptional()
  @IsEnum(ExpensePaymentStatus)
  status?: ExpensePaymentStatus;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsOptional()
  @IsString()
  payer?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateGoUsExpenseDto extends CreateGoUsExpenseDto {}
