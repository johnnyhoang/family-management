import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { MaintenanceFrequencyType } from '../maintenance.types';

export class CreateMaintenanceDto {
  @IsUUID()
  assetId: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsEnum(MaintenanceFrequencyType)
  frequencyType?: MaintenanceFrequencyType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  frequencyValue?: number;

  /** Khi có frequencyType: dùng để sinh số bản ghi (1–48), không lưu DB */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(48)
  repeatCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  reminderDaysBefore?: number;
}
