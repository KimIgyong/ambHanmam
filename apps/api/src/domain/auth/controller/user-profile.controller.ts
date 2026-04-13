import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import { UserEntity } from '../entity/user.entity';
import { detectProfileImageContentType } from '../util/profile-avatar.util';

@ApiTags('User Profile')
@ApiBearerAuth()
@Controller('users')
export class UserProfileController {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  @Get(':userId/profile-image')
  @ApiOperation({ summary: '사용자 프로필 이미지 조회' })
  async getProfileImage(@Param('userId') userId: string, @Res() res: Response) {
    const user = await this.userRepo.findOne({
      where: { usrId: userId },
      withDeleted: true,
      select: ['usrId', 'usrProfileImage'],
    });
    if (!user?.usrProfileImage) {
      return res.status(404).json({ success: false, error: 'Profile image not found' });
    }
    res.setHeader('Content-Type', detectProfileImageContentType(user.usrProfileImage));
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(user.usrProfileImage);
  }
}
