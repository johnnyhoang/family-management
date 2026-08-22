import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { GoUsStage } from '../../../common/entities/gous-case.entity';
import { TaskPriority, TaskStatus } from '../../../common/entities/gous-task.entity';

export class CreateTaskDto {
  @IsOptional()
  @IsEnum(GoUsStage)
  stage?: GoUsStage;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsBoolean()
  isSystemSuggested?: boolean;

  @IsOptional()
  @IsString()
  expertTips?: string;
}

export class UpdateTaskDto extends CreateTaskDto {}
