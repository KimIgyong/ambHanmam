import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentConfigEntity } from '../entity/agent-config.entity';
import { UserCellEntity } from '../../members/entity/user-cell.entity';
import { UpdateAgentConfigRequest } from '../dto/request/update-agent-config.request';
import { AGENT_INFO_MAP } from '../constant/agent.constant';
import { BusinessException } from '../../../global/filter/business.exception';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

// Import default prompts
import { getLegalPrompt } from '../prompt/legal.prompt';
import { getAccountingPrompt } from '../prompt/accounting.prompt';
import { getTranslationPrompt } from '../prompt/translation.prompt';
import { getPmPrompt } from '../prompt/pm.prompt';
import { getDevelopmentPrompt } from '../prompt/development.prompt';
import { getItPrompt } from '../prompt/it.prompt';

@Injectable()
export class AgentConfigService {
  private readonly defaultPrompts: Record<string, () => string> = {
    LEGAL: getLegalPrompt,
    ACCOUNTING: getAccountingPrompt,
    TRANSLATION: getTranslationPrompt,
    PM: getPmPrompt,
    DEVELOPMENT: getDevelopmentPrompt,
    IT: () => getItPrompt(''),
  };

  constructor(
    @InjectRepository(AgentConfigEntity)
    private readonly configRepo: Repository<AgentConfigEntity>,
    @InjectRepository(UserCellEntity)
    private readonly userGroupRepo: Repository<UserCellEntity>,
  ) {}

  async getConfigs() {
    const configs = await this.configRepo.find({
      where: { agcIsDeleted: false },
      relations: ['updatedByUser'],
      order: { agcUnitCode: 'ASC' },
    });

    // Merge with AGENT_INFO_MAP to include all departments
    return Object.keys(AGENT_INFO_MAP).map((unitCode) => {
      const config = configs.find((c) => c.agcUnitCode === unitCode);
      const info = AGENT_INFO_MAP[unitCode as keyof typeof AGENT_INFO_MAP];
      return {
        unitCode: unitCode,
        unitName: info.unitName,
        description: config?.agcDescription || info.description,
        isActive: config?.agcIsActive ?? true,
        hasCustomPrompt: !!config?.agcSystemPrompt,
        visibleCellIds: config?.agcVisibleCellIds ?? null,
        updatedBy: config?.updatedByUser ? { id: config.agcUpdatedBy, name: config.updatedByUser.usrName } : null,
        updatedAt: config?.agcUpdatedAt?.toISOString() || null,
      };
    });
  }

  async getConfig(unitCode: string) {
    const config = await this.configRepo.findOne({
      where: { agcUnitCode: unitCode, agcIsDeleted: false },
      relations: ['updatedByUser'],
    });

    const info = AGENT_INFO_MAP[unitCode as keyof typeof AGENT_INFO_MAP];
    // AGENT_INFO_MAP에 없어도 에러 처리하지 않고 기본값 사용
    const deptInfo = info || {
      unitName: unitCode,
      description: null,
    };

    const defaultPromptFn = this.defaultPrompts[unitCode];
    const defaultPrompt = defaultPromptFn ? defaultPromptFn() : '';

    return {
      unitCode: unitCode,
      unitName: deptInfo.unitName,
      description: config?.agcDescription || deptInfo.description || null,
      systemPrompt: config?.agcSystemPrompt || defaultPrompt,
      isActive: config?.agcIsActive ?? true,
      hasCustomPrompt: !!config?.agcSystemPrompt,
      visibleCellIds: config?.agcVisibleCellIds ?? null,
      defaultPrompt,
      updatedBy: config?.updatedByUser ? { id: config.agcUpdatedBy, name: config.updatedByUser.usrName } : null,
      updatedAt: config?.agcUpdatedAt?.toISOString() || null,
    };
  }

  async updateConfig(unitCode: string, dto: UpdateAgentConfigRequest, userId: string) {
    let config = await this.configRepo.findOne({
      where: { agcUnitCode: unitCode, agcIsDeleted: false },
    });

    if (!config) {
      config = this.configRepo.create({
        agcUnitCode: unitCode,
        agcIsDeleted: false,
      });
    }

    config.agcSystemPrompt = dto.system_prompt;
    if (dto.description !== undefined) config.agcDescription = dto.description || null;
    // TRANSLATION 에이전트는 항상 활성화 & 전체 공개 강제
    if (unitCode === 'TRANSLATION') {
      config.agcIsActive = true;
      config.agcVisibleCellIds = null;
    } else {
      if (dto.is_active !== undefined) config.agcIsActive = dto.is_active;
      if (dto.visible_cell_ids !== undefined) config.agcVisibleCellIds = dto.visible_cell_ids;
    }
    config.agcUpdatedBy = userId;

    await this.configRepo.save(config);
    return this.getConfig(unitCode);
  }

  async resetConfig(unitCode: string, userId: string) {
    const config = await this.configRepo.findOne({
      where: { agcUnitCode: unitCode, agcIsDeleted: false },
    });

    if (config) {
      config.agcSystemPrompt = null;
      config.agcUpdatedBy = userId;
      await this.configRepo.save(config);
    }

    return this.getConfig(unitCode);
  }

  async getPromptForDepartment(unitCode: string): Promise<string | null> {
    const config = await this.configRepo.findOne({
      where: { agcUnitCode: unitCode, agcIsDeleted: false },
    });
    return config?.agcSystemPrompt || null;
  }

  /**
   * 사용자가 접근 가능한 에이전트 목록 반환
   * - TRANSLATION: 항상 노출
   * - 나머지: agcVisibleGroupIds가 null이면 전체 공개,
   *            []이면 비공개, [grpId, ...]이면 해당 그룹만 공개
   */
  async getVisibleAgents(userId: string) {
    const configs = await this.configRepo.find({
      where: { agcIsDeleted: false, agcIsActive: true },
    });

    const configMap = new Map(configs.map((c) => [c.agcUnitCode, c]));
    const mergedConfigs = Object.keys(AGENT_INFO_MAP).map((unitCode) => {
      const cfg = configMap.get(unitCode);
      if (cfg) return cfg;

      return {
        agcUnitCode: unitCode,
        agcDescription: null,
        agcIsActive: true,
        agcVisibleCellIds: null,
      } as AgentConfigEntity;
    });

    // 사용자가 속한 그룹 목록
    const userGroups = await this.userGroupRepo.find({ where: { usrId: userId } });
    const userGroupIds = userGroups.map((g) => g.celId);

    return mergedConfigs
      .filter((c) => {
        // TRANSLATION은 항상 노출
        if (c.agcUnitCode === 'TRANSLATION') return true;
        // null → 전체 공개
        if (c.agcVisibleCellIds === null) return true;
        // 빈 배열 → 비공개
        if (c.agcVisibleCellIds.length === 0) return false;
        // 교집합이 있으면 노출
        return c.agcVisibleCellIds.some((gid) => userGroupIds.includes(gid));
      })
      .map((c) => {
        const info = AGENT_INFO_MAP[c.agcUnitCode as keyof typeof AGENT_INFO_MAP];
        return {
          unitCode: c.agcUnitCode,
          unitName: info?.unitName || c.agcUnitCode,
          description: c.agcDescription || info?.description || null,
          isActive: c.agcIsActive,
          visibleCellIds: c.agcVisibleCellIds,
        };
      });
  }
}
