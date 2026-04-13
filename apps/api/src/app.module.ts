import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { CalendarModule } from './domain/calendar/calendar.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './domain/auth/auth.module';
import { AgentModule } from './domain/agent/agent.module';
import { ChatModule } from './domain/chat/chat.module';
import { ClaudeModule } from './infrastructure/external/claude/claude.module';
import { SettingsModule } from './domain/settings/settings.module';
import { InvitationModule } from './domain/invitation/invitation.module';
import { MembersModule } from './domain/members/members.module';
import { MailModule } from './infrastructure/external/mail/mail.module';
import { TodoModule } from './domain/todo/todo.module';
import { MeetingNotesModule } from './domain/meeting-notes/meeting-notes.module';
import { AttendanceModule } from './domain/attendance/attendance.module';
import { AssetModule } from './domain/asset/asset.module';
import { ExpenseRequestModule } from './domain/expense-request/expense-request.module';
import { NoticesModule } from './domain/notices/notices.module';
import { FileModule } from './infrastructure/file/file.module';
import { GoogleDriveModule } from './infrastructure/external/google-drive/google-drive.module';
import { DriveModule } from './domain/drive/drive.module';
import { AccountingModule } from './domain/accounting/accounting.module';
import { HrModule } from './domain/hr/hr.module';
import { BillingModule } from './domain/billing/billing.module';
import { UnitModule } from './domain/unit/unit.module';
import { AclModule } from './domain/acl/acl.module';
import { KmsModule } from './domain/kms/kms.module';
import { ProjectModule } from './domain/project/project.module';
import { MigrationModule } from './domain/migration/migration.module';
import { SiteManagementModule } from './domain/site-management/site-management.module';
import { ServiceManagementModule } from './domain/service-management/service-management.module';
import { AmoebaTalkModule } from './domain/amoeba-talk/amoeba-talk.module';
import { IssuesModule } from './domain/issues/issues.module';
import { SearchModule } from './domain/search/search.module';
import { TranslationModule } from './domain/translation/translation.module';
import { PopbillModule } from './infrastructure/external/popbill/popbill.module';
import { NotificationModule } from './domain/notification/notification.module';
import { PortalBridgeModule } from './domain/portal-bridge/portal-bridge.module';
import { EntitySettingsModule } from './domain/entity-settings/entity-settings.module';
import { AiUsageModule } from './domain/ai-usage/ai-usage.module';
import { AdminModule } from './domain/admin/admin.module';
import { TodayModule } from './domain/today/today.module';
import { AnalyticsModule } from './domain/analytics/analytics.module';
import { ReportModule } from './domain/report/report.module';
import { ClientPortalModule } from './domain/client-portal/client-portal.module';
import { PartnerModule } from './domain/partner/partner.module';
import { PartnerPortalModule } from './domain/partner-portal/partner-portal.module';
import { PartnerAppModule } from './domain/partner-app/partner-app.module';
import { OAuthModule } from './domain/oauth/oauth.module';
import { OpenApiModule } from './domain/open-api/open-api.module';
import { PaymentGatewayModule } from './domain/payment-gateway/payment-gateway.module';
import { PolarModule } from './domain/polar/polar.module';
import { SubscriptionModule } from './domain/subscription/subscription.module';
import { ExternalTaskImportModule } from './domain/external-task-import/external-task-import.module';
import { SlackIntegrationModule } from './domain/slack-integration/slack-integration.module';
import { AsanaIntegrationModule } from './domain/asana-integration/asana-integration.module';
import { ActivityIndexModule } from './domain/activity-index/activity-index.module';
import { SharedEntityModule } from './global/shared-entity/shared-entity.module';
import { AmoebaTalkIntegrationModule } from './domain/amoeba-talk-integration/amoeba-talk-integration.module';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(process.cwd(), '../../env/backend/.env.development'),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const username = configService.get<string>('DB_USERNAME');
        const password = configService.get<string>('DB_PASSWORD');
        if (!username || !password) {
          throw new Error('DB_USERNAME and DB_PASSWORD environment variables are required');
        }
        return {
        type: 'postgres' as const,
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5442),
        username,
        password,
        database: configService.get<string>('DB_DATABASE', 'db_amb_hanmam'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
        timezone: 'UTC',
        retryAttempts: 3,
        retryDelay: 3000,
        extra: {
          max: 20,
          min: 5,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      };
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    NestScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    SharedEntityModule,
    MailModule,
    SettingsModule,
    ClaudeModule,
    AuthModule,
    AgentModule,
    ChatModule,
    InvitationModule,
    MembersModule,
    TodoModule,
    MeetingNotesModule,
    AttendanceModule,
    AssetModule,
    ExpenseRequestModule,
    NoticesModule,
    FileModule,
    GoogleDriveModule,
    DriveModule,
    AccountingModule,
    HrModule,
    BillingModule,
    UnitModule,
    AclModule,
    KmsModule,
    ProjectModule,
    ServiceManagementModule,
    AmoebaTalkModule,
    IssuesModule,
    SearchModule,
    PopbillModule,
    TranslationModule,
    CalendarModule,
    MigrationModule,
    SiteManagementModule,
    NotificationModule,
    PortalBridgeModule,
    EntitySettingsModule,
    AiUsageModule,
    AdminModule,
    TodayModule,
    AnalyticsModule,
    ReportModule,
    ClientPortalModule,
    PartnerModule,
    PartnerPortalModule,
    PartnerAppModule,
    OAuthModule,
    OpenApiModule,
    PaymentGatewayModule,
    PolarModule,
    SubscriptionModule,
    ExternalTaskImportModule,
    SlackIntegrationModule,
    AsanaIntegrationModule,
    ActivityIndexModule,
    AmoebaTalkIntegrationModule,
  ],
})
export class AppModule {}
