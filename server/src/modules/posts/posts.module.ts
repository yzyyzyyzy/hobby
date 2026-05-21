import { Module } from '@nestjs/common'
import { PostsController, CirclePostsController, CommentsController } from './posts.controller'
import { PostsService } from './posts.service'

@Module({
  controllers: [PostsController, CirclePostsController, CommentsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
