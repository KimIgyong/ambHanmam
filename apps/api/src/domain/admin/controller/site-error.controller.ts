import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Param,
  Body,
  Req,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AdminLevelGuard } from '../../../global/guard/admin-level.guard';
import { Public } from '../../../global/decorator/public.decorator';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { SiteErrorService } from '../service/site-error.service';
import { CreateSiteErrorDto } from '../dto/create-site-error.dto';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

@ApiTags('Site Errors')
@Controller('site-errors')
export class SiteErrorController {
  private readonly logger = new Logger(SiteErrorController.name);

  constructor(private readonly siteErrorService: SiteErrorService) {}

  /** 프론트엔드에서 에러 로그 전송 (인증 불필요) */
  @Post()
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Report frontend error (public)' })
  async reportError(@Body() dto: CreateSiteErrorDto, @Req() req: Request) {
    try {
      const user = (req as any).user as UserPayload | undefined;
      await this.siteErrorService.create({
        source: dto.source,
        app: dto.app,
        userId: user?.userId || null,
        userEmail: user?.email || null,
        userLevel: user?.level || null,
        entityId: user?.entityId || null,
        pageUrl: dto.page_url || null,
        apiEndpoint: dto.api_endpoint || null,
        httpMethod: dto.http_method || null,
        httpStatus: dto.http_status || null,
        errorCode: dto.error_code || null,
        errorMessage: dto.error_message,
        stackTrace: dto.stack_trace || null,
        userAgent: req.headers['user-agent'] || null,
        ipAddress: req.ip || null,
      });
    } catch (err) {
      this.logger.warn(`Failed to record site error: ${(err as Error).message}`);
    }
    return { recorded: true };
  }

  /** 관리자: 에러 로그 목록 조회 */
  @Get()
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: 'List site error logs (admin)' })
  findAll(
    @Query('source') source?: string,
    @Query('app') app?: string,
    @Query('usr_level') usrLevel?: string,
    @Query('status') status?: string,
    @Query('http_status') httpStatus?: string,
    @Query('error_code') errorCode?: string,
    @Query('search') search?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.siteErrorService.findAll({
      source,
      app,
      usrLevel,
      status,
      httpStatus: httpStatus ? parseInt(httpStatus, 10) : undefined,
      errorCode,
      search,
      dateFrom,
      dateTo,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /** 관리자: 에러 통계 */
  @Get('stats')
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: 'Get site error statistics (admin)' })
  getStats() {
    return this.siteErrorService.getStats();
  }

  /** 관리자: 에러 코드표 조회 */
  @Get('error-codes')
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: 'Get error code reference table (admin)' })
  getErrorCodes() {
    const httpStatusMap: Record<string, number> = {
      E1001: 401, E1002: 401, E1003: 401, E1004: 401,
      E1005: 403, E1006: 403, E1007: 400, E1008: 400, E1009: 400,
      E1010: 403, E1011: 403, E1012: 403, E1013: 403,
      E9001: 500, E9002: 500,
    };
    const categoryMap: Record<string, string> = {
      E1: 'AUTH', E2: 'USER', E3: 'CONVERSATION', E4: 'AGENT',
      E5: 'SETTINGS', E6: 'TALK', E7: 'GROUP', E8: 'SETTINGS',
      E9: 'SYSTEM', E10: 'TODO', E11: 'MEETING', E12: 'ATTENDANCE',
      E13: 'NOTICE', E14: 'DRIVE', E15: 'ACCOUNTING', E16: 'HR',
      E17: 'BILLING', E19: 'ACL', E20: 'KMS',
      E21: 'PROJECT', E22: 'SERVICE', E23: 'ISSUE', E24: 'TRANSLATION',
      E25: 'ASSET', E26: 'CALENDAR', E27: 'CMS', E28: 'PAYMENT',
    };

    return Object.entries(ERROR_CODE).map(([key, { code, message }]) => {
      const prefix = code.match(/^E(\d+?)\d{3}$/)?.[1] || code.match(/^E(\d+)/)?.[1] || '';
      const category = categoryMap['E' + prefix] || 'UNKNOWN';
      return {
        key,
        code,
        message,
        httpStatus: httpStatusMap[code] || (code.startsWith('E9') ? 500 : code.startsWith('E1') && Number(code.slice(1)) <= 1004 ? 401 : 400),
        category,
      };
    });
  }

  /** 관리자: 에러 상태 변경 (OPEN → RESOLVED / IGNORED) */
  @Patch(':id/status')
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: 'Update site error status (admin)' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.siteErrorService.updateStatus(id, status, user.userId);
  }
}
