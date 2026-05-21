import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common'
import { PostsService } from './posts.service'

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async listPosts(
    @Query('circle_id') circleId: string,
    @Query('sort') sort: string = 'latest',
  ) {
    console.log('[Posts] GET /api/posts', { circleId, sort })
    const result = await this.postsService.listPosts(circleId, sort)
    return { code: 200, msg: 'success', data: result }
  }

  @Get(':id')
  async getPost(@Param('id') id: string) {
    console.log('[Posts] GET /api/posts/:id', id)
    const result = await this.postsService.getPost(id)
    return { code: 200, msg: 'success', data: result }
  }

  @Post()
  async createPost(@Body() body: { circle_id: string; user_id: string; content: string; images?: string[]; tags?: string[]; mention_owner?: boolean; is_draft?: boolean }) {
    console.log('[Posts] POST /api/posts', JSON.stringify({ ...body, content: body.content?.slice(0, 50) }))
    const result = await this.postsService.createPost(body)
    return { code: 200, msg: 'success', data: result }
  }

  @Post('like')
  async likePost(@Body() body: { post_id: string; user_id: string }) {
    console.log('[Posts] POST /api/posts/like', JSON.stringify(body))
    const result = await this.postsService.likePost(body)
    return { code: 200, msg: 'success', data: result }
  }

  @Get(':id/comments')
  async getComments(@Param('id') postId: string) {
    console.log('[Posts] GET /api/posts/:id/comments', postId)
    const result = await this.postsService.getComments(postId)
    return { code: 200, msg: 'success', data: result }
  }

  @Post(':id/comments')
  async createComment(
    @Param('id') postId: string,
    @Body() body: { user_id: string; content: string; parent_id?: string; reply_to_nickname?: string },
  ) {
    console.log('[Posts] POST /api/posts/:id/comments', postId, JSON.stringify(body))
    const result = await this.postsService.createComment(postId, body)
    return { code: 200, msg: 'success', data: result }
  }

  @Put(':id')
  async updatePost(@Param('id') id: string, @Body() body: { content?: string; is_draft?: boolean }) {
    console.log('[Posts] PUT /api/posts/:id', id)
    const result = await this.postsService.updatePost(id, body)
    return { code: 200, msg: 'success', data: result }
  }
}

@Controller('circles')
export class CirclePostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get(':circleId/posts')
  async getCirclePosts(
    @Param('circleId') circleId: string,
    @Query('sort') sort: string = 'latest',
  ) {
    console.log('[CirclePosts] GET /api/circles/:circleId/posts', { circleId, sort })
    const result = await this.postsService.listPosts(circleId, sort)
    return { code: 200, msg: 'success', data: result }
  }
}

@Controller('comments')
export class CommentsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  async createComment(
    @Body() body: { post_id: string; user_id: string; content: string; parent_id?: string; reply_to_nickname?: string },
  ) {
    console.log('[Comments] POST /api/comments', JSON.stringify(body))
    const result = await this.postsService.createComment(body.post_id, body)
    return { code: 200, msg: 'success', data: result }
  }
}
