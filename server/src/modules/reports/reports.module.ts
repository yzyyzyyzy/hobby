import { Module } from '@nestjs/common'
import { ReportsController, AdminController } from './reports.controller'
import { ReportsService } from './reports.service'

@Module({
  controllers: [ReportsController, AdminController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
