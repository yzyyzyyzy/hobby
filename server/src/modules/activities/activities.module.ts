import { Module } from '@nestjs/common'
import { ActivitiesController, CircleActivitiesController } from './activities.controller'
import { ActivitiesService } from './activities.service'

@Module({
  controllers: [ActivitiesController, CircleActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
