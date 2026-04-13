import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import axios from 'axios';
import { getAmoebaTalkConfig } from './config/amoeba-talk.config';
import { UserPayload } from '../../global/decorator/current-user.decorator';

@Injectable()
export class AmoebaTalkIntegrationService {
  private readonly logger = new Logger(AmoebaTalkIntegrationService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Generate signed connect token for AmoebaTalk registration
   * Contains user info + entity info, signed with shared secret
   */
  async generateConnectToken(user: UserPayload): Promise<{ connectUrl: string }> {
    try {
      this.logger.log(`generateConnectToken called for user: ${JSON.stringify({ userId: user.userId, email: user.email, entityId: user.entityId, companyId: user.companyId })}`);

      const config = getAmoebaTalkConfig();
      if (!config.sharedSecret) {
        throw new BadRequestException('AmoebaTalk integration not configured');
      }

      // Get entity info
      const entity = await this.getEntityInfo(user);
      this.logger.log(`Entity info: ${JSON.stringify(entity)}`);
      if (!entity) {
        throw new BadRequestException('Entity not found for current user');
      }

      const userName = await this.getUserName(user.userId);

      const payload = {
        sub: user.userId,
        email: user.email,
        name: userName,
        entityId: entity.entId,
        entityCode: entity.entCode,
        entityName: entity.entName,
        jti: randomUUID(),
      };

      const token = jwt.sign(payload, config.sharedSecret, {
        algorithm: 'HS256',
        expiresIn: '30m',
      });

      const connectUrl = `${config.connectUrl}?token=${token}`;

      this.logger.log(`Connect token generated for ${user.email} → ${entity.entCode}`);

      return { connectUrl };
    } catch (error) {
      this.logger.error(`generateConnectToken failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check if current user's AMB account is linked to AmoebaTalk
   */
  async getConnectionStatus(user: UserPayload): Promise<{
    linked: boolean;
    linkedAt?: string;
    companyName?: string;
  }> {
    const config = getAmoebaTalkConfig();
    if (!config.apiUrl || !config.apiKey) {
      return { linked: false };
    }

    try {
      const res = await axios.get(`${config.apiUrl}/integration/amb/check-link`, {
        params: { amb_user_id: user.userId },
        headers: { 'x-api-key': config.apiKey },
        timeout: 5000,
      });

      return {
        linked: res.data?.linked || false,
        linkedAt: res.data?.linkedAt,
        companyName: res.data?.companyName,
      };
    } catch (e) {
      this.logger.warn(`Failed to check AmoebaTalk link status: ${e.message}`);
      return { linked: false };
    }
  }

  /**
   * Get entity info for user (HQ admin → first entity, USER_LEVEL → their entity)
   */
  private async getEntityInfo(user: UserPayload): Promise<{
    entId: string;
    entCode: string;
    entName: string;
  } | null> {
    // If user has entityId from JWT, use it
    if (user.entityId) {
      const rows = await this.dataSource.query(
        `SELECT ent_id as "entId", ent_code as "entCode", ent_name as "entName"
         FROM amb_hr_entities WHERE ent_id = $1 LIMIT 1`,
        [user.entityId],
      );
      return rows[0] || null;
    }

    // For ADMIN_LEVEL (HQ), use their companyId or first subsidiary
    if (user.companyId) {
      const rows = await this.dataSource.query(
        `SELECT ent_id as "entId", ent_code as "entCode", ent_name as "entName"
         FROM amb_hr_entities WHERE ent_id = $1 LIMIT 1`,
        [user.companyId],
      );
      return rows[0] || null;
    }

    // Fallback: first non-HQ entity
    const rows = await this.dataSource.query(
      `SELECT ent_id as "entId", ent_code as "entCode", ent_name as "entName"
       FROM amb_hr_entities WHERE ent_level = 'SUBSIDIARY'        ORDER BY ent_created_at ASC LIMIT 1`,
    );
    return rows[0] || null;
  }

  private async getUserName(userId: string): Promise<string> {
    const rows = await this.dataSource.query(
      `SELECT usr_name as name FROM amb_users WHERE usr_id = $1 LIMIT 1`,
      [userId],
    );
    return rows[0]?.name || 'Unknown';
  }

  private async getUserAvatar(userId: string): Promise<string | null> {
    const rows = await this.dataSource.query(
      `SELECT usr_profile_image as avatar FROM amb_users WHERE usr_id = $1 LIMIT 1`,
      [userId],
    );
    const avatar = rows[0]?.avatar;
    if (!avatar) return null;
    // Only include avatar if it's a URL string, not binary data
    if (typeof avatar === 'string' && (avatar.startsWith('http') || avatar.startsWith('/'))) {
      return avatar;
    }
    // Binary/Buffer avatar cannot be embedded in JWT — skip
    return null;
  }
}
