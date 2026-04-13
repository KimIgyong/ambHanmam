import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, ILike, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { BCRYPT_SALT_ROUNDS } from '@amb/common';
import { PortalCustomerReadonlyEntity } from '../entity/portal-customer-readonly.entity';
import { PortalUserMappingEntity } from '../entity/portal-user-mapping.entity';
import { PortalPaymentReadonlyEntity } from '../entity/portal-payment-readonly.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { EntityUserRoleEntity } from '../../hr/entity/entity-user-role.entity';
import { EmployeeEntity } from '../../hr/entity/employee.entity';
import { SvcClientEntity } from '../../service-management/entity/client.entity';
import { SvcSubscriptionEntity } from '../../service-management/entity/subscription.entity';
import { MailService } from '../../../infrastructure/external/mail/mail.service';
import { EmailTemplateService } from '../../settings/service/email-template.service';
import { UserPayload } from '../../../global/decorator/current-user.decorator';
import { CreateInternalAccountRequest } from '../dto/create-internal-account.request';
import { PortalCustomerQueryRequest } from '../dto/portal-customer-query.request';
import { AutoProvisionPortalCustomerRequest } from '../dto/auto-provision-portal-customer.request';
import { createDefaultProfileImage } from '../../auth/util/profile-avatar.util';

@Injectable()
export class PortalBridgeService {
  private readonly logger = new Logger(PortalBridgeService.name);

  constructor(
    @InjectRepository(PortalCustomerReadonlyEntity)
    private readonly customerRepo: Repository<PortalCustomerReadonlyEntity>,
    @InjectRepository(PortalUserMappingEntity)
    private readonly mappingRepo: Repository<PortalUserMappingEntity>,
    @InjectRepository(PortalPaymentReadonlyEntity)
    private readonly paymentRepo: Repository<PortalPaymentReadonlyEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepo: Repository<HrEntityEntity>,
    @InjectRepository(EntityUserRoleEntity)
    private readonly entityUserRoleRepo: Repository<EntityUserRoleEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
    @InjectRepository(SvcClientEntity)
    private readonly clientRepo: Repository<SvcClientEntity>,
    @InjectRepository(SvcSubscriptionEntity)
    private readonly subscriptionRepo: Repository<SvcSubscriptionEntity>,
    private readonly mailService: MailService,
    private readonly emailTemplateService: EmailTemplateService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 포탈 고객 목록 조회 (검색, 페이징, 매핑 여부 표시)
   */
  async findPortalCustomers(query: PortalCustomerQueryRequest) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.customerRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect(
        PortalUserMappingEntity,
        'm',
        'm.pctId = c.pctId AND m.pumStatus = :mappingStatus',
        { mappingStatus: 'ACTIVE' },
      )
      .addSelect('m.pumId', 'mappingId')
      .addSelect('m.usrId', 'mappedUserId')
      .where('c.pctDeletedAt IS NULL');

    // 상태 필터
    if (query.status) {
      qb.andWhere('c.pctStatus = :status', { status: query.status });
    }

    // 검색 (이메일, 이름, 회사명)
    if (query.search) {
      qb.andWhere(
        '(c.pctEmail ILIKE :search OR c.pctName ILIKE :search OR c.pctCompanyName ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    // 매핑 필터
    if (query.mapping_filter === 'mapped') {
      qb.andWhere('m.pumId IS NOT NULL');
    } else if (query.mapping_filter === 'unmapped') {
      qb.andWhere('m.pumId IS NULL');
    }

    // 국가 필터
    if (query.country) {
      qb.andWhere('c.pctCountry = :country', { country: query.country });
    }

    // 정렬 (화이트리스트 검증)
    const sortColumnMap: Record<string, string> = {
      name: 'c.pctName',
      email: 'c.pctEmail',
      company: 'c.pctCompanyName',
      country: 'c.pctCountry',
      created_at: 'c.pctCreatedAt',
    };
    const sortColumn = sortColumnMap[query.sort_by ?? 'created_at'] ?? 'c.pctCreatedAt';
    const sortOrder = query.sort_order === 'ASC' ? 'ASC' : 'DESC';

    const total = await qb.getCount();
    const items = await qb
      .orderBy(sortColumn, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getRawAndEntities();

    const customers = items.entities.map((customer, idx) => ({
      ...customer,
      isMapped: !!items.raw[idx]?.mappingId,
      mappedUserId: items.raw[idx]?.mappedUserId || null,
    }));

    return {
      items: customers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 포탈 고객 상세 조회
   */
  async findPortalCustomerDetail(pctId: string) {
    const customer = await this.customerRepo.findOne({
      where: { pctId, pctDeletedAt: IsNull() },
    });
    if (!customer) {
      throw new NotFoundException('Portal customer not found');
    }

    // 매핑 정보
    const mapping = await this.mappingRepo.findOne({
      where: { pctId, pumStatus: 'ACTIVE' },
      relations: ['user'],
    });

    return {
      ...customer,
      mapping: mapping
        ? {
            pumId: mapping.pumId,
            usrId: mapping.usrId,
            userName: mapping.user?.usrName,
            userEmail: mapping.user?.usrEmail,
            userRole: mapping.user?.usrRole,
            mappedAt: mapping.pumCreatedAt,
          }
        : null,
    };
  }

  /**
   * 포탈 고객 → 내부 계정 생성
   */
  async createInternalAccount(
    pctId: string,
    dto: CreateInternalAccountRequest,
    adminUser: UserPayload,
  ) {
    // 1. 포탈 고객 존재 확인
    const customer = await this.customerRepo.findOne({
      where: { pctId, pctDeletedAt: IsNull() },
    });
    if (!customer) {
      throw new NotFoundException('Portal customer not found');
    }

    // 2. 이미 매핑된 계정 확인
    const existingMapping = await this.mappingRepo.findOne({
      where: { pctId },
    });
    if (existingMapping && existingMapping.pumStatus === 'ACTIVE') {
      throw new ConflictException('Portal customer already has an active mapping');
    }

    // 3. 법인 존재 확인
    const entity = await this.entityRepo.findOne({
      where: { entId: dto.entity_id },
    });
    if (!entity) {
      throw new BadRequestException('Entity not found');
    }

    // 4. 임시 비밀번호 생성
    const tempPassword = uuidv4().replace(/-/g, '').slice(0, 12);
    const hashedPassword = await bcrypt.hash(tempPassword, BCRYPT_SALT_ROUNDS);

    // 5. 내부 시스템에 동일 이메일+법인 사용자 존재 확인 (법인별 독립)
    let user = await this.userRepo.findOne({
      where: { usrEmail: customer.pctEmail, usrCompanyId: dto.entity_id },
    });

    if (user) {
      // 기존 계정에 법인/역할 업데이트
      user.usrRole = dto.role;
      user.usrLevelCode = 'USER_LEVEL';
      user.usrCompanyId = dto.entity_id;
      user.usrStatus = 'ACTIVE';
      user.usrJoinMethod = 'PORTAL';
      user.usrMustChangePw = true;
      user.usrPassword = hashedPassword;
      if (!user.usrProfileImage) {
        user.usrProfileImage = createDefaultProfileImage(customer.pctName, customer.pctEmail);
      }
      if (dto.department) user.usrUnit = dto.department;
      user = await this.userRepo.save(user);
    } else {
      // 신규 계정 생성
      user = this.userRepo.create({
        usrEmail: customer.pctEmail,
        usrPassword: hashedPassword,
        usrName: customer.pctName,
        usrUnit: dto.department || 'GENERAL',
        usrRole: dto.role,
        usrLevelCode: 'USER_LEVEL',
        usrStatus: 'ACTIVE',
        usrJoinMethod: 'PORTAL',
        usrCompanyId: dto.entity_id,
        usrMustChangePw: true,
        usrProfileImage: createDefaultProfileImage(customer.pctName, customer.pctEmail),
      });
      user = await this.userRepo.save(user);
    }

    // 6. EntityUserRole 생성/업데이트 (법인-사용자 역할 매핑)
    let entityRole = await this.entityUserRoleRepo.findOne({
      where: { entId: dto.entity_id, usrId: user.usrId },
    });
    if (entityRole) {
      entityRole.eurRole = dto.role;
      entityRole.eurStatus = 'ACTIVE';
    } else {
      entityRole = this.entityUserRoleRepo.create({
        entId: dto.entity_id,
        usrId: user.usrId,
        eurRole: dto.role,
        eurStatus: 'ACTIVE',
        eurIsOwner: true, // [R4] 포탈 직접 가입자 = 법인 소유자
      });
    }
    await this.entityUserRoleRepo.save(entityRole);

    // 7. HR Employee 자동 생성 (기존 직원이 없는 경우만)
    const existingEmployee = await this.employeeRepo.findOne({
      where: { usrId: user.usrId, entId: dto.entity_id },
    });
    if (!existingEmployee) {
      try {
        const empCode = await this.generateEmployeeCode(dto.entity_id, entity.entCode);
        const employee = this.employeeRepo.create({
          entId: dto.entity_id,
          usrId: user.usrId,
          empCode,
          empFullName: customer.pctName,
          empNationality: 'KOREAN',
          empCccdNumber: `PORTAL-${uuidv4().replace(/-/g, '').slice(0, 8)}`,
          empStartDate: new Date().toISOString().split('T')[0],
          empContractType: 'EMPLOYEE',
          empDepartment: dto.department || 'GENERAL',
          empPosition: this.mapRoleToPosition(dto.role),
          empRegion: 'REGION_1',
          empSalaryType: 'GROSS',
          empWorkSchedule: 'MON_FRI',
        });
        await this.employeeRepo.save(employee);
        this.logger.log(`Auto-created HR employee ${empCode} for user ${user.usrId}`);
      } catch (error) {
        this.logger.warn(`Failed to auto-create HR employee: ${error.message}`);
      }
    }

    // 8. 매핑 테이블 INSERT 또는 REVOKED → 재활성화
    let mapping: PortalUserMappingEntity;
    if (existingMapping) {
      // REVOKED 매핑 재활성화
      existingMapping.usrId = user.usrId;
      existingMapping.pumStatus = 'ACTIVE';
      existingMapping.pumCreatedBy = adminUser.userId;
      existingMapping.pumRevokedBy = null;
      existingMapping.pumRevokedAt = null;
      mapping = await this.mappingRepo.save(existingMapping);
    } else {
      mapping = this.mappingRepo.create({
        pctId,
        usrId: user.usrId,
        pumCreatedBy: adminUser.userId,
      });
      mapping = await this.mappingRepo.save(mapping);
    }

    // 9. [R1] 임시 비밀번호 이메일 제거 — InitialSetup에서 사용자가 직접 설정
    // ACCOUNT_CREATED 템플릿은 유지 (초대 등 다른 경로에서 사용 가능)

    this.logger.log(
      `Portal customer ${pctId} converted to internal user ${user.usrId} by ${adminUser.email}`,
    );

    return {
      userId: user.usrId,
      email: user.usrEmail,
      name: user.usrName,
      role: user.usrRole,
      entityId: dto.entity_id,
      entityCode: entity.entCode,
      entityName: entity.entName,
      mappingId: mapping.pumId,
    };
  }

  /**
   * 매핑 목록 조회
   */
  async findMappings(page = 1, limit = 20) {
    const [items, total] = await this.mappingRepo.findAndCount({
      relations: ['portalCustomer', 'user'],
      order: { pumCreatedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((m) => ({
        pumId: m.pumId,
        pumStatus: m.pumStatus,
        pumCreatedAt: m.pumCreatedAt,
        portalCustomer: {
          pctId: m.portalCustomer.pctId,
          pctEmail: m.portalCustomer.pctEmail,
          pctName: m.portalCustomer.pctName,
          pctCompanyName: m.portalCustomer.pctCompanyName,
        },
        user: {
          usrId: m.user.usrId,
          usrEmail: m.user.usrEmail,
          usrName: m.user.usrName,
          usrRole: m.user.usrRole,
          usrStatus: m.user.usrStatus,
        },
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 매핑 해제 (내부 계정 비활성화)
   */
  async revokeMapping(pumId: string, adminUser: UserPayload) {
    const mapping = await this.mappingRepo.findOne({
      where: { pumId, pumStatus: 'ACTIVE' },
      relations: ['user'],
    });
    if (!mapping) {
      throw new NotFoundException('Active mapping not found');
    }

    // 매핑 비활성화
    mapping.pumStatus = 'REVOKED';
    mapping.pumRevokedBy = adminUser.userId;
    mapping.pumRevokedAt = new Date();
    await this.mappingRepo.save(mapping);

    // 내부 계정 비활성화
    if (mapping.user) {
      mapping.user.usrStatus = 'INACTIVE';
      await this.userRepo.save(mapping.user);
    }

    this.logger.log(
      `Mapping ${pumId} revoked by ${adminUser.email}, user ${mapping.usrId} deactivated`,
    );

    return { pumId, status: 'REVOKED' };
  }

  /**
   * 포탈 회원가입 직후 내부계정 자동 프로비저닝
   */
  async autoProvisionPortalCustomer(
    pctId: string,
    dto: AutoProvisionPortalCustomerRequest,
  ) {
    const customer = await this.customerRepo.findOne({
      where: { pctId, pctDeletedAt: IsNull() },
    });
    if (!customer) {
      throw new NotFoundException('Portal customer not found');
    }

    const existingMapping = await this.mappingRepo.findOne({
      where: { pctId, pumStatus: 'ACTIVE' },
      relations: ['user'],
    });

    if (existingMapping?.user) {
      return {
        alreadyMapped: true,
        mappingId: existingMapping.pumId,
        userId: existingMapping.user.usrId,
        email: existingMapping.user.usrEmail,
        name: existingMapping.user.usrName,
      };
    }

    const entity = await this.resolveOrCreateEntityForPortalCustomer(customer);
    const role = dto.role || 'MASTER';
    const adminUser: UserPayload = {
      userId: await this.resolveSystemActorUserId(),
      email: 'portal-auto-provision@amoeba.local',
      role: 'SYSTEM',
      level: 'ADMIN_LEVEL',
      status: 'ACTIVE',
    };

    const result = await this.createInternalAccount(
      pctId,
      {
        entity_id: entity.entId,
        role,
        department: dto.department,
      } as CreateInternalAccountRequest,
      adminUser,
    );

    return {
      alreadyMapped: false,
      ...result,
    };
  }

  /**
   * 자동 로그인 토큰 생성 (Portal-API에서 호출)
   */
  async generateAutoLoginToken(pctId: string): Promise<string> {
    const customer = await this.customerRepo.findOne({
      where: { pctId, pctDeletedAt: IsNull() },
    });
    if (!customer) {
      throw new NotFoundException('Portal customer not found');
    }

    const mapping = await this.mappingRepo.findOne({
      where: { pctId, pumStatus: 'ACTIVE' },
      relations: ['user'],
    });
    if (!mapping?.user) {
      throw new BadRequestException('No active user mapping found');
    }

    const user = mapping.user;
    const entity = user.usrCompanyId
      ? await this.entityRepo.findOne({ where: { entId: user.usrCompanyId } })
      : null;

    const token = this.jwtService.sign(
      {
        type: 'portal_auto_login',
        sub: user.usrId,
        email: user.usrEmail,
        entityCode: entity?.entCode,
      },
      { expiresIn: '5m' },
    );

    return token;
  }

  private async resolveOrCreateEntityForPortalCustomer(customer: PortalCustomerReadonlyEntity) {
    const companyName = (customer.pctCompanyName || customer.pctName || customer.pctEmail?.split('@')[0] || 'Company').trim();

    const country = this.normalizeCountryCode(customer.pctCountry);
    const existingEntity = await this.entityRepo.findOne({
      where: {
        entName: ILike(companyName),
        entCountry: country,
      },
    });

    if (existingEntity) {
      return existingEntity;
    }

    const entCode = await this.generateUniqueEntityCode(country);
    const entity = this.entityRepo.create({
      entCode,
      entName: companyName,
      entNameEn: companyName,
      entCountry: country,
      entCurrency: this.defaultCurrencyByCountry(country),
      entPhone: customer.pctPhone,
      entEmail: customer.pctEmail,
      entStatus: 'ACTIVE',
      entLevel: 'SUBSIDIARY',
      entIsHq: false,
      entSortOrder: 0,
      entParentId: null,
    } as any);

    const saved = await this.entityRepo.save(entity) as unknown as HrEntityEntity;
    return saved;
  }

  private normalizeCountryCode(country: string | null): string {
    const code = (country || '').trim().toUpperCase();
    if (code === 'KOREA') return 'KR';
    if (code === 'VIETNAM') return 'VN';
    if (code === 'KR' || code === 'VN') return code;
    return 'VN';
  }

  private defaultCurrencyByCountry(country: string): string {
    if (country === 'KR') return 'KRW';
    if (country === 'VN') return 'VND';
    return 'USD';
  }

  private async generateUniqueEntityCode(country: string): Promise<string> {
    const prefix = country === 'KR' ? 'KR' : 'VN';
    let attempts = 0;
    while (attempts < 10) {
      const candidate = `${prefix}${String(Math.floor(Math.random() * 9000) + 1000)}`;
      const exists = await this.entityRepo.findOne({ where: { entCode: candidate } });
      if (!exists) {
        return candidate;
      }
      attempts += 1;
    }
    throw new ConflictException('Failed to generate unique entity code');
  }

  private async resolveSystemActorUserId(): Promise<string> {
    const admin = await this.userRepo.findOne({
      where: {
        usrLevelCode: 'ADMIN_LEVEL',
        usrStatus: 'ACTIVE',
      },
      order: { usrCreatedAt: 'ASC' },
    });

    if (!admin) {
      throw new BadRequestException('No active ADMIN_LEVEL user found for auto provisioning');
    }

    return admin.usrId;
  }

  private async generateEmployeeCode(entityId: string, entCode: string): Promise<string> {
    const result = await this.employeeRepo
      .createQueryBuilder('emp')
      .select('MAX(emp.empCode)', 'maxCode')
      .where('emp.entId = :entityId', { entityId })
      .andWhere('emp.empCode LIKE :prefix', { prefix: `${entCode}%` })
      .getRawOne();

    let nextSeq = 1;
    if (result?.maxCode) {
      const seqPart = result.maxCode.substring(entCode.length);
      const parsed = parseInt(seqPart, 10);
      if (!isNaN(parsed)) {
        nextSeq = parsed + 1;
      }
    }

    return `${entCode}${String(nextSeq).padStart(4, '0')}`;
  }

  private mapRoleToPosition(role: string): string {
    const map: Record<string, string> = {
      MASTER: '대표',
      MANAGER: '매니저',
      MEMBER: '사원',
      VIEWER: '사원',
    };
    return map[role] || '사원';
  }

  /**
   * 포탈 고객의 국가 코드 목록 (distinct, non-null)
   */
  async getDistinctCountries(): Promise<string[]> {
    const rows = await this.customerRepo
      .createQueryBuilder('c')
      .select('DISTINCT c.pctCountry', 'country')
      .where('c.pctDeletedAt IS NULL')
      .andWhere('c.pctCountry IS NOT NULL')
      .orderBy('c.pctCountry', 'ASC')
      .getRawMany();
    return rows.map((r) => r.country);
  }

  /**
   * 포탈 고객 소프트 삭제
   * - 활성 매핑이 있으면 자동 REVOKE 처리
   * - pct_deleted_at 설정 (soft delete)
   */
  async deletePortalCustomer(pctId: string, adminUserId: string) {
    const customer = await this.customerRepo.findOne({
      where: { pctId, pctDeletedAt: IsNull() },
    });
    if (!customer) {
      throw new NotFoundException('Portal customer not found');
    }

    // 활성 매핑 자동 REVOKE
    const activeMappings = await this.mappingRepo.find({
      where: { pctId, pumStatus: 'ACTIVE' },
    });
    if (activeMappings.length > 0) {
      for (const mapping of activeMappings) {
        mapping.pumStatus = 'REVOKED';
        mapping.pumRevokedBy = adminUserId;
        mapping.pumRevokedAt = new Date();
      }
      await this.mappingRepo.save(activeMappings);
      this.logger.log(`Revoked ${activeMappings.length} active mapping(s) for customer ${pctId}`);
    }

    // Soft delete (읽기전용 엔티티이므로 createQueryBuilder 직접 UPDATE)
    await this.customerRepo
      .createQueryBuilder()
      .update()
      .set({ pctDeletedAt: new Date() } as any)
      .where('pctId = :pctId', { pctId })
      .execute();

    this.logger.log(`Portal customer ${pctId} (${customer.pctEmail}) soft-deleted by ${adminUserId}`);

    return {
      pctId,
      revokedMappings: activeMappings.length,
    };
  }

  /**
   * 포탈 고객 삭제 미리보기 (영향받는 데이터 수량 조회)
   */
  async getDeletionPreview(pctId: string) {
    const customer = await this.customerRepo
      .createQueryBuilder('c')
      .addSelect('c.pctDeletedAt')
      .where('c.pctId = :pctId', { pctId })
      .getOne();
    if (!customer) {
      throw new NotFoundException('Portal customer not found');
    }

    const mappingsCount = await this.mappingRepo.count({ where: { pctId } });
    const paymentsCount = await this.paymentRepo.count({ where: { ppmCustomerId: pctId } });
    const completedPayments = await this.paymentRepo.count({
      where: { ppmCustomerId: pctId, ppmStatus: 'COMPLETED' },
    });

    let client: { cliId: string; cliCompanyName: string } | null = null;
    let subscriptionsCount = 0;
    let activeSubscriptions = 0;
    let usageRecordsCount = 0;

    if (customer.pctCliId) {
      const clientEntity = await this.clientRepo
        .createQueryBuilder('c')
        .addSelect('c.cliDeletedAt')
        .where('c.cliId = :cliId', { cliId: customer.pctCliId })
        .getOne();
      if (clientEntity) {
        client = { cliId: clientEntity.cliId, cliCompanyName: clientEntity.cliCompanyName };

        const subs = await this.subscriptionRepo
          .createQueryBuilder('s')
          .addSelect('s.subDeletedAt')
          .where('s.cliId = :cliId', { cliId: clientEntity.cliId })
          .getMany();
        subscriptionsCount = subs.length;
        activeSubscriptions = subs.filter((s) => s.subStatus === 'ACTIVE' && !s.subDeletedAt).length;

        if (subs.length > 0) {
          const subIds = subs.map((s) => s.subId);
          const usageResult = await this.customerRepo.manager
            .createQueryBuilder()
            .select('COUNT(*)', 'cnt')
            .from('amb_svc_usage_records', 'u')
            .where('u.sub_id IN (:...subIds)', { subIds })
            .getRawOne();
          usageRecordsCount = parseInt(usageResult?.cnt || '0', 10);
        }
      }
    }

    return {
      customer: {
        pctId: customer.pctId,
        pctEmail: customer.pctEmail,
        pctName: customer.pctName,
        pctCompanyName: customer.pctCompanyName,
        pctStatus: customer.pctStatus,
        isSoftDeleted: !!customer.pctDeletedAt,
      },
      counts: {
        mappings: mappingsCount,
        payments: paymentsCount,
        client,
        subscriptions: subscriptionsCount,
        usageRecords: usageRecordsCount,
      },
      warnings: {
        hasActiveSubscription: activeSubscriptions > 0,
        hasCompletedPayments: completedPayments > 0,
      },
    };
  }

  /**
   * 포탈 고객 완전 삭제 (Hard Delete)
   * Level 1: 고객 + 매핑 + 결제 삭제
   * Level 2: Level 1 + 고객사 + 구독 + 사용기록 삭제
   */
  async deleteCustomerPermanent(pctId: string, level: number, confirmEmail: string, adminUserId: string) {
    // 1. 고객 조회 (soft-deleted 포함)
    const customer = await this.customerRepo
      .createQueryBuilder('c')
      .addSelect('c.pctDeletedAt')
      .where('c.pctId = :pctId', { pctId })
      .getOne();
    if (!customer) {
      throw new NotFoundException('Portal customer not found');
    }

    // 2. 이메일 확인 검증
    if (customer.pctEmail.toLowerCase() !== confirmEmail.toLowerCase()) {
      throw new BadRequestException('Confirmation email does not match');
    }

    // 3. Level 2: 활성 구독 확인
    const cliId = customer.pctCliId;
    if (level === 2 && cliId) {
      const activeSubs = await this.subscriptionRepo.count({
        where: { cliId, subStatus: 'ACTIVE' },
      });
      if (activeSubs > 0) {
        throw new BadRequestException('Cannot permanently delete: customer has active subscriptions. Cancel subscriptions first.');
      }
    }

    // 4. 트랜잭션 내에서 삭제 실행
    const deletedCounts = await this.customerRepo.manager.transaction(async (tx) => {
      const counts = { mappings: 0, payments: 0, usageRecords: 0, subscriptions: 0, client: false };

      // Level 2: 고객사/구독/사용기록 삭제
      if (level === 2 && cliId) {
        // 사용기록 삭제 (raw SQL — apps/api에 엔티티 없음)
        const subs = await tx.find(SvcSubscriptionEntity, {
          where: { cliId },
          select: ['subId'],
          withDeleted: true,
        });
        if (subs.length > 0) {
          const subIds = subs.map((s) => s.subId);
          const usageResult = await tx
            .createQueryBuilder()
            .delete()
            .from('amb_svc_usage_records')
            .where('sub_id IN (:...subIds)', { subIds })
            .execute();
          counts.usageRecords = usageResult.affected || 0;
        }

        // 구독 삭제 (hard delete, soft-deleted 포함)
        const subResult = await tx
          .createQueryBuilder()
          .delete()
          .from(SvcSubscriptionEntity)
          .where('cliId = :cliId', { cliId })
          .execute();
        counts.subscriptions = subResult.affected || 0;

        // 고객사 삭제
        const clientResult = await tx
          .createQueryBuilder()
          .delete()
          .from(SvcClientEntity)
          .where('cliId = :cliId', { cliId })
          .execute();
        counts.client = (clientResult.affected || 0) > 0;
      }

      // Level 1: 매핑 + 결제 + 고객 삭제
      const mappingResult = await tx.delete(PortalUserMappingEntity, { pctId });
      counts.mappings = mappingResult.affected || 0;

      const paymentResult = await tx.delete(PortalPaymentReadonlyEntity, { ppmCustomerId: pctId });
      counts.payments = paymentResult.affected || 0;

      // 고객 레코드 hard delete
      await tx
        .createQueryBuilder()
        .delete()
        .from(PortalCustomerReadonlyEntity)
        .where('pct_id = :pctId', { pctId })
        .execute();

      return counts;
    });

    this.logger.warn(
      `[PERMANENT DELETE] Portal customer ${pctId} (${customer.pctEmail}) permanently deleted by ${adminUserId}. ` +
      `Level: ${level}, Deleted: mappings=${deletedCounts.mappings}, payments=${deletedCounts.payments}, ` +
      `subscriptions=${deletedCounts.subscriptions}, usageRecords=${deletedCounts.usageRecords}, client=${deletedCounts.client}`,
    );

    return {
      pctId,
      level,
      deleted: deletedCounts,
    };
  }
}
