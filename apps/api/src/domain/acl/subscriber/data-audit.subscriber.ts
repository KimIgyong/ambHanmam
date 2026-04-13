import {
  EventSubscriber,
  EntitySubscriberInterface,
  UpdateEvent,
  SoftRemoveEvent,
  RemoveEvent,
  DataSource,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataAuditLogEntity } from '../entity/data-audit-log.entity';
import { REQUEST_CONTEXT } from '../../../global/constant/request-context';

/**
 * 중요 엔티티의 UPDATE / SOFT_DELETE / HARD_DELETE를 자동으로 감사 로그에 기록합니다.
 * 
 * 감사 대상 테이블 목록은 AUDITED_TABLES에서 관리합니다.
 * 새로운 테이블을 감사 대상에 추가하려면 Set에 테이블 이름을 추가하세요.
 */
const AUDITED_TABLES = new Set([
  'amb_users',
  'amb_todos',
  'amb_issues',
  'amb_hr_entities',
  'amb_entity_user_roles',
  'amb_api_keys',
  'amb_mail_accounts',
  'amb_permissions',
  'amb_notices',
  'amb_expense_requests',
]);

/** 비밀번호 등 민감 컬럼은 변경 내역에서 마스킹 */
const MASKED_COLUMNS = new Set([
  'usrPassword', 'usr_password',
  'aksKeyEnc', 'aks_key_enc',
  'macPasswordEnc', 'mac_password_enc',
]);

@Injectable()
@EventSubscriber()
export class DataAuditSubscriber implements EntitySubscriberInterface {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    dataSource.subscribers.push(this);
  }

  private isAudited(tableName?: string): boolean {
    return !!tableName && AUDITED_TABLES.has(tableName);
  }

  private getChanges(
    databaseEntity: any,
    updatedColumns: any[],
    entity: any,
  ): Record<string, { old: any; new: any }> | null {
    if (!databaseEntity || !entity) return null;
    const changes: Record<string, { old: any; new: any }> = {};
    for (const col of updatedColumns) {
      const propName = col.propertyName;
      if (MASKED_COLUMNS.has(propName) || MASKED_COLUMNS.has(col.databaseName)) {
        changes[propName] = { old: '***', new: '***' };
      } else {
        changes[propName] = { old: databaseEntity[propName], new: entity[propName] };
      }
    }
    return Object.keys(changes).length > 0 ? changes : null;
  }

  private getPrimaryKey(event: UpdateEvent<any> | SoftRemoveEvent<any> | RemoveEvent<any>): string {
    const metadata = event.metadata;
    const entity = event.entity || (event as any).databaseEntity;
    if (!entity || !metadata.primaryColumns.length) return 'unknown';
    return metadata.primaryColumns.map((col) => entity[col.propertyName]).join(',');
  }

  private getUserId(): string | null {
    // AsyncLocalStorage에서 현재 요청의 userId를 가져옴
    try {
      const store = REQUEST_CONTEXT.getStore();
      return store?.userId || null;
    } catch {
      return null;
    }
  }

  async afterUpdate(event: UpdateEvent<any>): Promise<void> {
    const tableName = event.metadata?.tableName;
    if (!this.isAudited(tableName)) return;

    const changes = this.getChanges(
      event.databaseEntity,
      event.updatedColumns || [],
      event.entity,
    );
    if (!changes) return;

    try {
      const repo = event.manager.getRepository(DataAuditLogEntity);
      await repo.save({
        dalUserId: this.getUserId(),
        dalAction: 'UPDATE',
        dalEntityName: event.metadata.name,
        dalTableName: tableName,
        dalRecordId: this.getPrimaryKey(event),
        dalChanges: changes,
      });
    } catch {
      // Audit log failure should never break the main operation
    }
  }

  async afterSoftRemove(event: SoftRemoveEvent<any>): Promise<void> {
    const tableName = event.metadata?.tableName;
    if (!this.isAudited(tableName)) return;

    try {
      const repo = event.manager.getRepository(DataAuditLogEntity);
      await repo.save({
        dalUserId: this.getUserId(),
        dalAction: 'SOFT_DELETE',
        dalEntityName: event.metadata.name,
        dalTableName: tableName,
        dalRecordId: this.getPrimaryKey(event),
        dalChanges: null,
      });
    } catch {
      // Audit log failure should never break the main operation
    }
  }

  async afterRemove(event: RemoveEvent<any>): Promise<void> {
    const tableName = event.metadata?.tableName;
    if (!this.isAudited(tableName)) return;

    try {
      const repo = event.manager.getRepository(DataAuditLogEntity);
      await repo.save({
        dalUserId: this.getUserId(),
        dalAction: 'HARD_DELETE',
        dalEntityName: event.metadata.name,
        dalTableName: tableName,
        dalRecordId: this.getPrimaryKey(event),
        dalChanges: null,
      });
    } catch {
      // Audit log failure should never break the main operation
    }
  }
}
