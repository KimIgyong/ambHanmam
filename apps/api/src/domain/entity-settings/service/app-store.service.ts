import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AppStoreApp {
  appSlug: string;
  appName: string;
  appNameEn: string | null;
  appStatus: 'ACTIVE' | 'COMING_SOON';
  appIconUrl: string | null;
  subscription: {
    subId: string;
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
    requestedAt: string;
    approvedAt: string | null;
    expiresAt: string | null;
  } | null;
}

@Injectable()
export class AppStoreService {
  private readonly logger = new Logger(AppStoreService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * AppStore Subscription API를 호출하여 Entity의 구독 현황 조회
   */
  async getSubscriptions(entityId: string): Promise<AppStoreApp[]> {
    const baseUrl = this.configService.get<string>('APP_STORE_API_URL');
    if (!baseUrl) {
      this.logger.warn('APP_STORE_API_URL is not configured');
      return [];
    }

    const url = `${baseUrl}/api/v1/platform/subscriptions/entity/${entityId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        this.logger.error(`AppStore API error: ${response.status} ${response.statusText}`);
        throw new InternalServerErrorException('Failed to fetch app store subscriptions');
      }

      const body = await response.json();

      if (!body?.success || !body?.data?.apps) {
        this.logger.error('AppStore API invalid response structure');
        return [];
      }

      return body.data.apps as AppStoreApp[];
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`AppStore API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new InternalServerErrorException('Failed to connect to app store');
    }
  }
}
