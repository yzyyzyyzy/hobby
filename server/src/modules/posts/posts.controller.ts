import { Controller, Get, Post, Delete, Body, Param, Query, Put } from '@nestjs/common'
import { PostsService } from './posts.service'

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('featured')
  async getFeaturedPosts(@Query('user_id') userId: string) {
    return { data: await this.postsService.getFeaturedPosts(userId) }
  }

  @Get(':id')
  async getPost(@Param('id') id: string, @Query('user_id') userId?: string) {
    const post = await this.postsService.getPost(id, userId)
    return { data: post }
  }

  @Get(':id/comments')
  async getComments(@Param('id') postId: string, @Query('user_id') userId?: string) {
    return { data: await this.postsService.getComments(postId, userId) }
  }

  @Post()
  async createPost(
    @Body() body: { circle_id: string; user_id: string; content: string; images?: string[]; tags?: string[]; is_draft?: boolean },
  ) {
    return { data: await this.postsService.createPost(body) }
  }

  @Post(':id/like')
  async likePost(@Param('id') id: string, @Body() body: { user_id: string }) {
    return this.postsService.likePost({ post_id: id, user_id: body.user_id })
  }

  @Post(':id/comments')
  async createComment(
    @Param('id') postId: string,
    @Body() body: { user_id: string; content: string; parent_id?: string; reply_to_user_id?: string },
  ) {
    return { data: await this.postsService.createComment(postId, body) }
  }

  @Delete(':id')
  async deletePost(@Param('id') id: string, @Body() body: { user_id: string }) {
    return this.postsService.deletePost(id, body.user_id)
  }

  @Put(':id')
  async updatePost(
    @Param('id') id: string,
    @Body() body: { content?: string; is_draft?: boolean },
  ) {
    return { data: await this.postsService.updatePost(id, body) }
  }

  @Post(':id/comments/:commentId/like')
  async likeComment(@Param('commentId') commentId: string, @Body() body: { user_id: string }) {
    return this.postsService.likeComment({ comment_id: commentId, user_id: body.user_id })
  }

  @Delete(':id/comments/:commentId')
  async deleteComment(@Param('commentId') commentId: string, @Body() body: { user_id: string }) {
    return this.postsService.deleteComment(commentId, body.user_id)
  }
}
