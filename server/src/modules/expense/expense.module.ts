import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from '../../common/entities/expense.entity';
import { ExpenseService } from './expense.service';
import { ExpenseController } from './expense.controller';
import { RecurringExpenseScheduler } from './recurring-expense.scheduler';
import { PermissionModule } from '../permission/permission.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense]),
    PermissionModule,
  ],
  controllers: [ExpenseController],
  providers: [ExpenseService, RecurringExpenseScheduler],
  exports: [ExpenseService],
})
export class ExpenseModule {}
