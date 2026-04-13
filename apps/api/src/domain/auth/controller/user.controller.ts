import {
  Controller, Get, Post, Patch, Delete, Body, Res,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Response } from 'express';
import { UserEntity } from '../entity/user.entity';
import { UserUnitRoleEntity } from '../../unit/entity/user-unit-role.entity';
import { EntityUserRoleEntity } from '../../hr/entity/entity-user-role.entity';
import { UserCellEntity } from '../../members/entity/user-cell.entity';
import { CellEntity } from '../../members/entity/cell.entity';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { detectProfileImageContentType } from '../util/profile-avatar.util';

@ApiTags('User')
@ApiBearerAuth()
@Controller('users/me')
export class UserController {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(UserUnitRoleEntity)
    private readonly deptRoleRepo: Repository<UserUnitRoleEntity>,
    @InjectRepository(EntityUserRoleEntity)
    private readonly entityRoleRepo: Repository<EntityUserRoleEntity>,
    @InjectRepository(UserCellEntity)
    private readonly userCellRepo: Repository<UserCellEntity>,
    @InjectRepository(CellEntity)
    private readonly cellRepo: Repository<CellEntity>,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get my profile with departments and entities' })
  async getMyProfile(@CurrentUser() user: UserPayload) {
    const dbUser = await this.userRepo.findOne({ where: { usrId: user.userId } });
    if (!dbUser) throw new BadRequestException('User not found');

    let deptRoles = await this.deptRoleRepo.find({
      where: { usrId: user.userId },
      relations: ['unit', 'unit.hrEntity'],
      order: { uurIsPrimary: 'DESC', uurCreatedAt: 'ASC' },
    });
    // USER_LEVEL: 로그인한 법인의 Unit만 표시
    if (user.level === 'USER_LEVEL' && user.companyId) {
      deptRoles = deptRoles.filter((dr) => dr.unit?.hrEntity?.entId === user.companyId);
    }

    // USER_LEVEL: 로그인한 법인 역할만 조회 (타법인 정보 차단)
    const entityRoleWhere: any = { usrId: user.userId };
    if (user.level === 'USER_LEVEL' && user.companyId) {
      entityRoleWhere.entId = user.companyId;
    }
    const entityRoles = await this.entityRoleRepo.find({
      where: entityRoleWhere,
      relations: ['hrEntity'],
      order: { eurCreatedAt: 'ASC' },
    });

    // Cell 소속 조회
    const userCells = await this.userCellRepo.find({ where: { usrId: user.userId } });
    const cellIds = userCells.map((uc) => uc.celId);
    let cells: { cellId: string; cellName: string; entityName: string }[] = [];
    if (cellIds.length > 0) {
      const cellEntities = await this.cellRepo.find({
        where: { celId: In(cellIds) },
        relations: ['hrEntity'],
      });
      let filtered = cellEntities;
      // USER_LEVEL: 로그인한 법인의 Cell만 표시
      if (user.level === 'USER_LEVEL' && user.companyId) {
        filtered = cellEntities.filter((c) => c.hrEntity?.entId === user.companyId);
      }
      cells = filtered.map((c) => ({
        cellId: c.celId,
        cellName: c.celName,
        entityName: c.hrEntity?.entName || '',
      }));
    }

    // 주요 Unit명 (isPrimary=true)
    const primaryUnit = deptRoles.find((dr) => dr.uurIsPrimary);
    const unitDisplay = primaryUnit?.unit?.untName || dbUser.usrUnit;

    return {
      success: true,
      data: {
        userId: dbUser.usrId,
        email: dbUser.usrEmail,
        name: dbUser.usrName,
        unit: unitDisplay,
        role: dbUser.usrRole,
        companyEmail: dbUser.usrCompanyEmail || null,
        phone: dbUser.usrPhone || null,
        profileImageUrl: dbUser.usrProfileImage ? '/api/v1/users/me/profile-image' : null,
        createdAt: dbUser.usrCreatedAt.toISOString(),
        units: deptRoles.map((dr) => ({
          unitId: dr.untId,
          unitName: dr.unit?.untName || '',
          role: dr.uurRole,
          isPrimary: dr.uurIsPrimary,
          entityName: dr.unit?.hrEntity?.entName || '',
        })),
        entities: entityRoles.map((er) => ({
          entityId: er.entId,
          entityCode: er.hrEntity?.entCode || '',
          entityName: er.hrEntity?.entName || '',
          country: er.hrEntity?.entCountry || '',
          role: er.eurRole,
          status: er.eurStatus,
        })),
        cells,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // ── 프로필 수정 ──

  @Patch('profile')
  @ApiOperation({ summary: '내 프로필 수정 (이름, 전화번호, 회사이메일)' })
  async updateProfile(
    @CurrentUser() user: UserPayload,
    @Body() body: { phone?: string; name?: string; company_email?: string },
  ) {
    const dbUser = await this.userRepo.findOne({ where: { usrId: user.userId } });
    if (!dbUser) throw new BadRequestException('User not found');

    const updateData: Partial<{ usrPhone: string | null; usrName: string; usrCompanyEmail: string | null }> = {};
    if (body.phone !== undefined) {
      if (body.phone !== null && body.phone.length > 30) {
        throw new BadRequestException('Phone number must be 30 characters or less');
      }
      updateData.usrPhone = body.phone || null;
    }
    if (body.name !== undefined) {
      const trimmed = (body.name || '').trim();
      if (!trimmed || trimmed.length > 100) {
        throw new BadRequestException('Name must be between 1 and 100 characters');
      }
      updateData.usrName = trimmed;
    }
    if (body.company_email !== undefined) {
      const email = (body.company_email || '').trim();
      if (email && (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
        throw new BadRequestException('Invalid company email format or too long (max 200)');
      }
      updateData.usrCompanyEmail = email || null;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    await this.userRepo.update({ usrId: user.userId }, updateData as any);
    return { success: true, timestamp: new Date().toISOString() };
  }

  // ── 프로필 이미지 ──

  @Post('profile-image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '프로필 이미지 업로드' })
  async uploadProfileImage(
    @CurrentUser() user: UserPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File is required');
    if (!['image/png', 'image/jpeg'].includes(file.mimetype)) {
      throw new BadRequestException('Only PNG or JPEG files are allowed');
    }
    if (file.size > 512000) {
      throw new BadRequestException('File must be smaller than 500KB');
    }

    await this.userRepo.update(
      { usrId: user.userId },
      { usrProfileImage: file.buffer },
    );
    return { success: true, timestamp: new Date().toISOString() };
  }

  @Get('profile-image')
  @ApiOperation({ summary: '프로필 이미지 조회' })
  async getProfileImage(@CurrentUser() user: UserPayload, @Res() res: Response) {
    const dbUser = await this.userRepo.findOne({ where: { usrId: user.userId } });
    if (!dbUser?.usrProfileImage) {
      return res.status(404).json({ success: false, error: 'Profile image not found' });
    }
    res.setHeader('Content-Type', detectProfileImageContentType(dbUser.usrProfileImage));
    res.setHeader('Cache-Control', 'max-age=3600');
    res.send(dbUser.usrProfileImage);
  }

  @Delete('profile-image')
  @ApiOperation({ summary: '프로필 이미지 삭제' })
  async deleteProfileImage(@CurrentUser() user: UserPayload) {
    await this.userRepo.update(
      { usrId: user.userId },
      { usrProfileImage: null as any },
    );
    return { success: true, timestamp: new Date().toISOString() };
  }

  // ── 서명 이미지 ──

  @Post('signature')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload signature image' })
  async uploadSignature(
    @CurrentUser() user: UserPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File is required');
    if (!['image/png', 'image/jpeg'].includes(file.mimetype)) {
      throw new BadRequestException('Only PNG or JPEG files are allowed');
    }
    if (file.size > 512000) {
      throw new BadRequestException('File must be smaller than 500KB');
    }

    await this.userRepo.update(
      { usrId: user.userId },
      { usrSignatureImage: file.buffer },
    );
    return { success: true, timestamp: new Date().toISOString() };
  }

  @Get('signature')
  @ApiOperation({ summary: 'Get my signature image' })
  async getSignature(@CurrentUser() user: UserPayload, @Res() res: Response) {
    const dbUser = await this.userRepo.findOne({ where: { usrId: user.userId } });
    if (!dbUser?.usrSignatureImage) {
      return res.status(404).json({ success: false, error: 'Signature image not found' });
    }
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'max-age=3600');
    res.send(dbUser.usrSignatureImage);
  }

  @Delete('signature')
  @ApiOperation({ summary: 'Delete my signature image' })
  async deleteSignature(@CurrentUser() user: UserPayload) {
    await this.userRepo.update(
      { usrId: user.userId },
      { usrSignatureImage: null as any },
    );
    return { success: true, timestamp: new Date().toISOString() };
  }

  // ── 번역 설정 ──

  @Get('translation-prefs')
  @ApiOperation({ summary: '내 번역 설정 조회' })
  async getTranslationPrefs(@CurrentUser() user: UserPayload) {
    const dbUser = await this.userRepo.findOne({ where: { usrId: user.userId } });
    if (!dbUser) throw new BadRequestException('User not found');
    return {
      success: true,
      data: dbUser.usrTranslationPrefs || { save_prompt: 'ASK', preferred_view_lang: 'original' },
      timestamp: new Date().toISOString(),
    };
  }

  @Patch('translation-prefs')
  @ApiOperation({ summary: '내 번역 설정 수정' })
  async updateTranslationPrefs(
    @CurrentUser() user: UserPayload,
    @Body() body: { save_prompt?: string; preferred_view_lang?: string },
  ) {
    const dbUser = await this.userRepo.findOne({ where: { usrId: user.userId } });
    if (!dbUser) throw new BadRequestException('User not found');

    const current = dbUser.usrTranslationPrefs || { save_prompt: 'ASK', preferred_view_lang: 'original' };
    const updated = { ...current, ...body };

    // Validate
    const validSavePrompts = ['ASK', 'ALWAYS', 'NEVER'];
    const validViewLangs = ['original', 'en', 'ko', 'vi'];
    if (updated.save_prompt && !validSavePrompts.includes(updated.save_prompt)) {
      throw new BadRequestException(`save_prompt must be one of: ${validSavePrompts.join(', ')}`);
    }
    if (updated.preferred_view_lang && !validViewLangs.includes(updated.preferred_view_lang)) {
      throw new BadRequestException(`preferred_view_lang must be one of: ${validViewLangs.join(', ')}`);
    }

    await this.userRepo.update({ usrId: user.userId }, { usrTranslationPrefs: updated as any });
    return { success: true, data: updated, timestamp: new Date().toISOString() };
  }

  // ── 타임존/로케일 설정 ──

  @Patch('timezone')
  @ApiOperation({ summary: '내 타임존/로케일 설정 수정' })
  async updateTimezone(
    @CurrentUser() user: UserPayload,
    @Body() body: { timezone?: string; locale?: string },
  ) {
    const VALID_TIMEZONES = ['Asia/Ho_Chi_Minh', 'Asia/Seoul', 'UTC', 'Asia/Tokyo', 'America/New_York', 'Europe/London'];
    const VALID_LOCALES = ['vi', 'ko', 'en'];

    if (body.timezone && !VALID_TIMEZONES.includes(body.timezone)) {
      throw new BadRequestException(`timezone must be one of: ${VALID_TIMEZONES.join(', ')}`);
    }
    if (body.locale && !VALID_LOCALES.includes(body.locale)) {
      throw new BadRequestException(`locale must be one of: ${VALID_LOCALES.join(', ')}`);
    }

    const updateData: Partial<{ usrTimezone: string; usrLocale: string }> = {};
    if (body.timezone) updateData.usrTimezone = body.timezone;
    if (body.locale) updateData.usrLocale = body.locale;

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('timezone or locale must be provided');
    }

    await this.userRepo.update({ usrId: user.userId }, updateData);

    const updated = await this.userRepo.findOne({ where: { usrId: user.userId } });
    return {
      success: true,
      data: {
        timezone: updated?.usrTimezone || 'Asia/Ho_Chi_Minh',
        locale: updated?.usrLocale || 'vi',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
