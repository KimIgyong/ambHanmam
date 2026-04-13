import {
  Controller,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Auth } from '../../auth/decorator/auth.decorator';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { ContentRatingService } from '../service/content-rating.service';
import { UpsertRatingDto } from '../dto/upsert-rating.dto';

@Controller('content-ratings')
export class ContentRatingController {
  constructor(private readonly contentRatingService: ContentRatingService) {}

  // ─── Issue Rating ───────────────────────────────────────────

  @Put('issues/:issueId')
  @Auth()
  async upsertIssueRating(
    @Param('issueId') issueId: string,
    @Body() dto: UpsertRatingDto,
    @CurrentUser() user: UserPayload,
  ) {
    await this.contentRatingService.upsertIssueRating(issueId, user.userId, dto.rating);
    return { success: true, timestamp: new Date().toISOString() };
  }

  @Delete('issues/:issueId')
  @Auth()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteIssueRating(
    @Param('issueId') issueId: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.contentRatingService.deleteIssueRating(issueId, user.userId);
  }

  // ─── Todo Rating ────────────────────────────────────────────

  @Put('todos/:todoId')
  @Auth()
  async upsertTodoRating(
    @Param('todoId') todoId: string,
    @Body() dto: UpsertRatingDto,
    @CurrentUser() user: UserPayload,
  ) {
    await this.contentRatingService.upsertTodoRating(todoId, user.userId, dto.rating);
    return { success: true, timestamp: new Date().toISOString() };
  }

  @Delete('todos/:todoId')
  @Auth()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTodoRating(
    @Param('todoId') todoId: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.contentRatingService.deleteTodoRating(todoId, user.userId);
  }

  // ─── Comment Rating ─────────────────────────────────────────

  @Put('comments/:type/:commentId')
  @Auth()
  async upsertCommentRating(
    @Param('type') type: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpsertRatingDto,
    @CurrentUser() user: UserPayload,
  ) {
    const typeMap: Record<string, string> = {
      'issue-comment': 'ISSUE_COMMENT',
      'todo-comment': 'TODO_COMMENT',
      'note-comment': 'NOTE_COMMENT',
    };
    const targetType = typeMap[type];
    await this.contentRatingService.upsertCommentRating(targetType, commentId, user.userId, dto.rating);
    return { success: true, timestamp: new Date().toISOString() };
  }

  @Delete('comments/:type/:commentId')
  @Auth()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCommentRating(
    @Param('type') type: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const typeMap: Record<string, string> = {
      'issue-comment': 'ISSUE_COMMENT',
      'todo-comment': 'TODO_COMMENT',
      'note-comment': 'NOTE_COMMENT',
    };
    const targetType = typeMap[type];
    await this.contentRatingService.deleteCommentRating(targetType, commentId, user.userId);
  }
}
