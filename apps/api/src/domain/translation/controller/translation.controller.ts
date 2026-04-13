import {
  Controller, Get, Post, Patch, Param, Body, Res, Headers,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { Response } from 'express';
import { TranslationService } from '../service/translation.service';
import { TranslateRequest } from '../dto/request/translate.request';
import { SaveWithTranslationRequest } from '../dto/request/save-with-translation.request';
import { UpdateTranslationRequest } from '../dto/request/update-translation.request';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';

class TranslateTextRequest {
  @IsString()
  text: string;

  @IsString()
  @IsIn(['en', 'ko', 'vi'])
  source_lang: string;

  @IsString()
  @IsIn(['en', 'ko', 'vi'])
  target_lang: string;
}

@ApiTags('번역')
@ApiBearerAuth()
@Controller('translations')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Post('translate')
  @ApiOperation({ summary: 'SSE 스트리밍 번역 요청' })
  async translateStream(
    @Body() dto: TranslateRequest,
    @CurrentUser() user: UserPayload,
    @Headers('x-entity-id') entityId: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      const stream$ = this.translationService.translateStream(dto, user.userId, entityId);

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
      res.write(`data: ${JSON.stringify({ error: message, done: true })}\n\n`);
      res.end();
    }
  }

  @Post('text')
  @ApiOperation({ summary: '즉석 텍스트 번역 (SSE, DB 저장 없음)' })
  async translateText(
    @Body() dto: TranslateTextRequest,
    @CurrentUser() user: UserPayload,
    @Headers('x-entity-id') entityId: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      const stream$ = this.translationService.translateTextStream(
        dto.text, dto.source_lang, dto.target_lang, entityId, user.userId,
      );

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
      res.write(`data: ${JSON.stringify({ error: message, done: true })}\n\n`);
      res.end();
    }
  }

  @Get(':sourceType/:sourceId')
  @ApiOperation({ summary: '콘텐츠 번역 목록 조회' })
  async getTranslations(
    @Param('sourceType') sourceType: string,
    @Param('sourceId') sourceId: string,
  ) {
    const data = await this.translationService.getTranslations(sourceType, sourceId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':sourceType/:sourceId/:targetLang')
  @ApiOperation({ summary: '특정 언어 번역 조회' })
  async getTranslation(
    @Param('sourceType') sourceType: string,
    @Param('sourceId') sourceId: string,
    @Param('targetLang') targetLang: string,
  ) {
    const data = await this.translationService.getTranslation(sourceType, sourceId, targetLang);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('save')
  @ApiOperation({ summary: '번역 저장 (Save-time)' })
  async saveTranslation(
    @Body() dto: SaveWithTranslationRequest,
    @CurrentUser() user: UserPayload,
    @Headers('x-entity-id') entityId: string | undefined,
  ) {
    const data = await this.translationService.saveTranslation(dto, user.userId, entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':trnId')
  @ApiOperation({ summary: '번역 수정' })
  async updateTranslation(
    @Param('trnId') trnId: string,
    @Body() dto: UpdateTranslationRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.translationService.updateTranslation(trnId, dto, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':trnId/lock')
  @ApiOperation({ summary: '번역 잠금 (수정 방지)' })
  async lockTranslation(
    @Param('trnId') trnId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.translationService.lockTranslation(trnId, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':trnId/unlock')
  @ApiOperation({ summary: '번역 잠금 해제' })
  async unlockTranslation(@Param('trnId') trnId: string) {
    const data = await this.translationService.unlockTranslation(trnId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':trnId/re-translate')
  @ApiOperation({ summary: '재번역 (SSE)' })
  async reTranslate(
    @Param('trnId') trnId: string,
    @CurrentUser() user: UserPayload,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      const stream$ = this.translationService.reTranslateStream(trnId, user.userId);

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
      res.write(`data: ${JSON.stringify({ error: message, done: true })}\n\n`);
      res.end();
    }
  }

  @Get(':trnId/history')
  @ApiOperation({ summary: '번역 수정 이력' })
  async getHistory(@Param('trnId') trnId: string) {
    const data = await this.translationService.getHistory(trnId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('source/:sourceType/:sourceId/original-lang')
  @ApiOperation({ summary: '콘텐츠 원본 언어 변경' })
  async updateOriginalLang(
    @Param('sourceType') sourceType: string,
    @Param('sourceId') sourceId: string,
    @Body() body: { original_lang: string },
  ) {
    await this.translationService.updateOriginalLang(sourceType, sourceId, body.original_lang);
    return { success: true, timestamp: new Date().toISOString() };
  }
}
