import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebClient } from '@slack/web-api';

@Injectable()
export class SlackApiService {
  private readonly logger = new Logger(SlackApiService.name);

  constructor(private readonly configService: ConfigService) {}

  private getClient(botToken: string): WebClient {
    return new WebClient(botToken);
  }

  async oauthAccess(code: string, redirectUri: string, clientId: string, clientSecret: string): Promise<any> {
    const client = new WebClient();
    const result = await client.oauth.v2.access({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    });
    return result;
  }

  async listConversations(botToken: string): Promise<any[]> {
    const client = this.getClient(botToken);
    const result = await client.conversations.list({
      types: 'public_channel,private_channel',
      exclude_archived: true,
      limit: 200,
    });
    return result.channels || [];
  }

  async conversationsJoin(botToken: string, channelId: string): Promise<void> {
    const client = this.getClient(botToken);
    await client.conversations.join({ channel: channelId });
  }

  async conversationsInfo(botToken: string, channelId: string): Promise<any> {
    const client = this.getClient(botToken);
    const result = await client.conversations.info({ channel: channelId });
    return result.channel;
  }

  async postMessage(
    botToken: string,
    params: { channel: string; text: string; thread_ts?: string },
  ): Promise<{ ok: boolean; ts?: string }> {
    const client = this.getClient(botToken);
    try {
      const result = await client.chat.postMessage(params);
      return { ok: result.ok ?? false, ts: result.ts };
    } catch (error) {
      this.logger.error(`Failed to post message to Slack: ${error.message}`);
      return { ok: false };
    }
  }

  async conversationsHistory(
    botToken: string,
    params: { channel: string; limit?: number; cursor?: string; latest?: string; oldest?: string },
  ): Promise<{ messages: any[]; nextCursor?: string; hasMore: boolean }> {
    const client = this.getClient(botToken);
    const result = await client.conversations.history({
      channel: params.channel,
      limit: params.limit || 50,
      cursor: params.cursor || undefined,
      latest: params.latest || undefined,
      oldest: params.oldest || undefined,
    });
    return {
      messages: result.messages || [],
      nextCursor: result.response_metadata?.next_cursor || undefined,
      hasMore: result.has_more ?? false,
    };
  }

  async conversationsReplies(
    botToken: string,
    params: { channel: string; ts: string; limit?: number; cursor?: string },
  ): Promise<{ messages: any[]; nextCursor?: string; hasMore: boolean }> {
    const client = this.getClient(botToken);
    const result = await client.conversations.replies({
      channel: params.channel,
      ts: params.ts,
      limit: params.limit || 100,
      cursor: params.cursor || undefined,
    });
    return {
      messages: result.messages || [],
      nextCursor: result.response_metadata?.next_cursor || undefined,
      hasMore: result.has_more ?? false,
    };
  }

  async authTest(botToken: string): Promise<{ ok: boolean; teamId?: string; teamName?: string; botUserId?: string; appId?: string; error?: string }> {
    const client = this.getClient(botToken);
    try {
      const result = await client.auth.test();
      return {
        ok: result.ok ?? false,
        teamId: result.team_id as string,
        teamName: result.team as string,
        botUserId: result.user_id as string,
        appId: (result as any).app_id || undefined,
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  async getChannelMembers(
    botToken: string,
    channelId: string,
  ): Promise<{ memberIds: string[]; nextCursor?: string }> {
    const client = this.getClient(botToken);
    const allMembers: string[] = [];
    let cursor: string | undefined;

    do {
      const result = await client.conversations.members({
        channel: channelId,
        limit: 200,
        cursor: cursor || undefined,
      });
      allMembers.push(...(result.members || []));
      cursor = result.response_metadata?.next_cursor || undefined;
    } while (cursor);

    return { memberIds: allMembers };
  }

  async getUserInfo(botToken: string, userId: string): Promise<any> {
    const client = this.getClient(botToken);
    const result = await client.users.info({ user: userId });
    return result.user;
  }

  async getUserDisplayName(botToken: string, userId: string): Promise<string> {
    try {
      const user = await this.getUserInfo(botToken, userId);
      return user?.profile?.display_name || user?.real_name || user?.name || 'Unknown';
    } catch {
      return 'Unknown';
    }
  }
}
