import { Module } from '@nestjs/common'
import { CircleResourcesController, ResourcesController } from './resources.controller'
import { ResourcesService } from './resources.service'

@Module({
  controllers: [CircleResourcesController, ResourcesController],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourcesModule {}
