import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, HttpCode, HttpStatus, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TodoService } from '../service/todo.service';
import { CreateTodoRequest } from '../dto/request/create-todo.request';
import { UpdateTodoRequest } from '../dto/request/update-todo.request';
import { CreateTodoCommentRequest } from '../dto/request/create-todo-comment.request';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { EntityGuard } from '../../hr/guard/entity.guard';

@ApiTags('할일')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('todos')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  // ── cell/company/unit 라우트는 :id 파라미터 라우트보다 먼저 선언 ──

  @Get('unit')
  @ApiOperation({ summary: 'Unit 할일 목록 조회' })
  async getUnitTodos(
    @CurrentUser() user: UserPayload,
    @Query('status') status?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
    @Query('search') search?: string,
    @Req() req?: any,
  ) {
    const data = await this.todoService.getUnitTodos(user.userId, {
      status,
      date_from: dateFrom,
      date_to: dateTo,
      search,
    }, req?.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('cell')
  @ApiOperation({ summary: '그룹 할일 목록 조회' })
  async getGroupTodos(
    @CurrentUser() user: UserPayload,
    @Query('status') status?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
    @Query('search') search?: string,
    @Req() req?: any,
  ) {
    const data = await this.todoService.getGroupTodos(user.userId, {
      status,
      date_from: dateFrom,
      date_to: dateTo,
      search,
    }, req?.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('company')
  @ApiOperation({ summary: '회사 할일 목록 조회' })
  async getCompanyTodos(
    @CurrentUser() user: UserPayload,
    @Query('status') status?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
    @Query('search') search?: string,
    @Req() req?: any,
  ) {
    const data = await this.todoService.getCompanyTodos(user.userId, {
      status,
      date_from: dateFrom,
      date_to: dateTo,
      search,
    }, req?.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get()
  @ApiOperation({ summary: '할일 목록 조회' })
  async getTodos(
    @CurrentUser() user: UserPayload,
    @Query('status') status?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
    @Req() req?: any,
  ) {
    const data = await this.todoService.getTodos(user.userId, {
      status,
      date_from: dateFrom,
      date_to: dateTo,
    }, req?.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: '할일 생성' })
  async createTodo(
    @Body() request: CreateTodoRequest,
    @CurrentUser() user: UserPayload,
    @Req() req?: any,
  ) {
    const data = await this.todoService.createTodo(request, user.userId, req?.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: '할일 상세 조회' })
  async getTodoById(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.todoService.getTodoById(id, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id')
  @ApiOperation({ summary: '할일 수정' })
  async updateTodo(
    @Param('id') id: string,
    @Body() request: UpdateTodoRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.todoService.updateTodo(id, request, user.userId, user.role);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: '할일 완료 처리' })
  async completeTodo(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.todoService.completeTodo(id, user.userId, user.role);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id/reopen')
  @ApiOperation({ summary: '할일 되돌리기 (완료 → 미완료)' })
  async reopenTodo(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.todoService.reopenTodo(id, user.userId, user.role);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id/status-logs')
  @ApiOperation({ summary: '할일 상태 변경 이력 조회' })
  async getStatusLogs(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.todoService.getStatusLogs(id, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id/comments')
  @ApiOperation({ summary: '할일 코멘트 목록 조회' })
  async getTodoComments(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.todoService.getTodoComments(id, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/comments')
  @ApiOperation({ summary: '할일 코멘트 작성' })
  async addTodoComment(
    @Param('id') id: string,
    @Body() request: CreateTodoCommentRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.todoService.addTodoComment(id, request.content, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '할일 코멘트 삭제' })
  async deleteTodoComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.todoService.deleteTodoComment(commentId, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '할일 삭제' })
  async deleteTodo(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.todoService.deleteTodo(id, user.userId, user.role);
  }
}
