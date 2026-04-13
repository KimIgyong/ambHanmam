import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Res,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ChatService } from '../service/chat.service';
import { CreateConversationRequest } from '../dto/request/create-conversation.request';
import { SendMessageRequest } from '../dto/request/send-message.request';
import { ConvertToKnowledgeRequest } from '../dto/request/convert-to-knowledge.request';
import { SendAdminMessageRequest } from '../dto/request/send-admin-message.request';
import { ConvertConversationToIssueRequest } from '../dto/request/convert-to-issue.request';
import { ConvertConversationToNoteRequest } from '../dto/request/convert-to-note.request';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { RolesGuard } from '../../../global/guard/roles.guard';
import { Roles } from '../../../global/decorator/roles.decorator';
import { BusinessException } from '../../../global/filter/business.exception';
import { TokenBalanceGuard } from '../../subscription/guard/token-balance.guard';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@amb/common';

@ApiTags('대화')
@ApiBearerAuth()
@Controller('conversations')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @ApiOperation({ summary: '대화 목록 조회' })
  async getConversations(
    @CurrentUser() user: UserPayload,
    @Query('page') page?: number,
    @Query('size') size?: number,
    @Query('department') department?: string,
    @Headers('x-entity-id') entityId?: string,
  ) {
    if (department) {
      const data = await this.chatService.getConversationsByDepartment(user.userId, department, entityId);
      return {
        success: true,
        data,
        pagination: {
          page: 1,
          size: data.length,
          totalCount: data.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
        timestamp: new Date().toISOString(),
      };
    }

    const currentPage = page || DEFAULT_PAGE;
    const currentSize = size || DEFAULT_PAGE_SIZE;
    const { data, totalCount } = await this.chatService.getConversations(
      user.userId,
      currentPage,
      currentSize,
      entityId,
    );

    const totalPages = Math.ceil(totalCount / currentSize);
    return {
      success: true,
      data,
      pagination: {
        page: currentPage,
        size: currentSize,
        totalCount,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  @ApiOperation({ summary: '새 대화 생성' })
  async createConversation(
    @Body() request: CreateConversationRequest,
    @CurrentUser() user: UserPayload,
    @Headers('x-entity-id') entityId?: string,
  ) {
    return this.chatService.createConversation(request, user.userId, entityId);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '관리자 대화 목록 조회' })
  async getAdminConversations(
    @Query('entity_id') entityId?: string,
    @Query('department') department?: string,
    @Query('userId') userId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('size') size?: number,
  ) {
    const currentPage = page || DEFAULT_PAGE;
    const currentSize = size || DEFAULT_PAGE_SIZE;
    const { data, totalCount } = await this.chatService.getAdminConversations(
      { entityId, department, userId, dateFrom, dateTo, search },
      currentPage,
      currentSize,
    );

    const totalPages = Math.ceil(totalCount / currentSize);
    return {
      success: true,
      data,
      pagination: {
        page: currentPage,
        size: currentSize,
        totalCount,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('admin/timeline')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '관리자 통합 대화 타임라인 조회' })
  async getAdminTimeline(
    @Query('entity_id') entityId?: string,
    @Query('department') department?: string,
    @Query('conversation_id') conversationId?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('size') size?: number,
  ) {
    const currentPage = page || DEFAULT_PAGE;
    const currentSize = size || DEFAULT_PAGE_SIZE;
    const { data, totalCount } = await this.chatService.getAdminTimeline(
      { entityId, department, conversationId, search },
      currentPage,
      currentSize,
    );

    const totalPages = Math.ceil(totalCount / currentSize);
    return {
      success: true,
      data,
      pagination: {
        page: currentPage,
        size: currentSize,
        totalCount,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '관리자 대화 상세 조회' })
  async getAdminConversationDetail(@Param('id') id: string) {
    const data = await this.chatService.getAdminConversationDetail(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('admin/:id/messages')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '관리자 메시지 전송' })
  async sendAdminMessage(
    @Param('id') id: string,
    @Body() request: SendAdminMessageRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.chatService.sendAdminMessage(id, request.content, user.userId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/convert-to-knowledge')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '대화를 지식으로 변환' })
  async convertToKnowledge(
    @Param('id') id: string,
    @Body() request: ConvertToKnowledgeRequest,
    @CurrentUser() user: UserPayload,
    @Headers('x-entity-id') entityId?: string,
  ) {
    const data = await this.chatService.convertToKnowledge(id, request, user.userId, entityId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/convert-to-issue')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '대화를 이슈로 변환' })
  async convertToIssue(
    @Param('id') id: string,
    @Body() request: ConvertConversationToIssueRequest,
    @CurrentUser() user: UserPayload,
    @Headers('x-entity-id') entityId?: string,
  ) {
    const data = await this.chatService.convertToIssue(id, request, user.userId, entityId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/convert-to-note')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '대화를 노트로 변환' })
  async convertToNote(
    @Param('id') id: string,
    @Body() request: ConvertConversationToNoteRequest,
    @CurrentUser() user: UserPayload,
    @Headers('x-entity-id') entityId?: string,
  ) {
    const data = await this.chatService.convertToNote(id, request, user.userId, entityId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '대화 상세 조회 (메시지 포함)' })
  async getConversationDetail(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.chatService.getConversationDetail(id, user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '대화 삭제' })
  async deleteConversation(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.chatService.deleteConversation(id, user.userId);
  }

  @Post(':id/messages')
  @UseGuards(TokenBalanceGuard)
  @ApiOperation({ summary: '메시지 전송 (SSE 스트리밍 응답)' })
  async sendMessage(
    @Param('id') id: string,
    @Body() request: SendMessageRequest,
    @CurrentUser() user: UserPayload,
    @Headers('accept-language') language: string,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      const stream$ = await this.chatService.sendMessage(id, request.content, user.userId, language);

      stream$.subscribe({
        next: (event) => {
          res.write(`data: ${event.data}\n\n`);
        },
        error: (err) => {
          const message = err instanceof Error ? err.message : 'Internal server error';
          res.write(`data: ${JSON.stringify({ error: message, done: true })}\n\n`);
          res.end();
        },
        complete: () => {
          res.end();
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      const code = error instanceof BusinessException ? error.errorCode : undefined;
      res.write(`data: ${JSON.stringify({ error: message, code, done: true })}\n\n`);
      res.end();
    }
  }
}
