import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommentService } from '../service/comment.service';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';

@Controller('work-items')
@UseGuards(AuthGuard('jwt'))
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get(':workItemId/comments')
  async getComments(@Param('workItemId') workItemId: string) {
    return {
      success: true,
      data: await this.commentService.getComments(workItemId),
    };
  }

  @Post(':workItemId/comments')
  async addComment(
    @Param('workItemId') workItemId: string,
    @Body() body: {
      content: string;
      type?: string;
      parent_id?: string;
      is_private?: boolean;
    },
    @CurrentUser() user: UserPayload,
  ) {
    return {
      success: true,
      data: await this.commentService.addComment({
        workItemId,
        authorId: user.userId,
        content: body.content,
        type: body.type,
        parentId: body.parent_id,
        isPrivate: body.is_private,
      }),
    };
  }

  @Put('comments/:commentId')
  async editComment(
    @Param('commentId') commentId: string,
    @Body('content') content: string,
    @CurrentUser() user: UserPayload,
  ) {
    return {
      success: true,
      data: await this.commentService.editComment(commentId, content, user.userId),
    };
  }

  @Delete('comments/:commentId')
  async deleteComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.commentService.deleteComment(commentId, user.userId);
    return { success: true };
  }
}
