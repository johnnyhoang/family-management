import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { MemberRoleInCase, ProcessStatus } from '../../../common/entities/gous-member.entity';

export class CreateMemberDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsOptional()
  @IsEnum(MemberRoleInCase)
  roleInCase?: MemberRoleInCase;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  passportNumber?: string;

  @IsOptional()
  @IsDateString()
  passportExpiry?: string;

  @IsOptional()
  @IsString()
  ds260ConfirmationNumber?: string;

  @IsOptional()
  @IsEnum(ProcessStatus)
  ds260Status?: ProcessStatus;

  @IsOptional()
  @IsEnum(ProcessStatus)
  policeCertStatus?: ProcessStatus;

  @IsOptional()
  @IsDateString()
  policeCertIssueDate?: string;

  @IsOptional()
  @IsEnum(ProcessStatus)
  medicalStatus?: ProcessStatus;

  @IsOptional()
  @IsEnum(ProcessStatus)
  visaStatus?: ProcessStatus;

  @IsOptional()
  @IsBoolean()
  uscisFeePaid?: boolean;

  @IsOptional()
  @IsNumber()
  cspaAge?: number;

  @IsOptional()
  @IsString()
  cspaStatus?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMemberDto extends CreateMemberDto {}
