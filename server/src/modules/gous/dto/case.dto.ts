import { IsEnum, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';
import { GoUsStage } from '../../../common/enums/gous.enums';

export class CreateGoUsCaseDto {
  @IsOptional()
  @IsString()
  visaCategory?: string;

  @IsOptional()
  @IsString()
  caseNumber?: string;

  @IsOptional()
  @IsString()
  invoiceId?: string;

  @IsOptional()
  @IsDateString()
  priorityDate?: string;

  @IsOptional()
  @IsDateString()
  approvalDate?: string;

  @IsOptional()
  @IsEnum(GoUsStage)
  currentStage?: GoUsStage;

  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @IsOptional()
  @IsString()
  petitionerName?: string;

  @IsOptional()
  @IsString()
  petitionerRelationship?: string;

  @IsOptional()
  @IsString()
  petitionerAddress?: string;

  @IsOptional()
  @IsString()
  petitionerPhone?: string;

  @IsOptional()
  @IsString()
  petitionerEmail?: string;

  @IsOptional()
  @IsString()
  principalApplicantName?: string;

  @IsOptional()
  @IsString()
  jointSponsorInfo?: string;

  @IsOptional()
  @IsDateString()
  interviewDate?: string;

  @IsOptional()
  @IsString()
  interviewLocation?: string;

  @IsOptional()
  @IsDateString()
  medicalExamDate?: string;

  @IsOptional()
  @IsDateString()
  vaccinationDate?: string;

  @IsOptional()
  @IsDateString()
  intendedDepartureDate?: string;

  @IsOptional()
  @IsString()
  portOfEntry?: string;

  @IsOptional()
  @IsString()
  destinationAddress?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateGoUsCaseDto extends CreateGoUsCaseDto {}
