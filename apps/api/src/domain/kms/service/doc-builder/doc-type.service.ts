import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocTypeEntity } from '../../entity/doc-type.entity';

@Injectable()
export class DocTypeService {
  private readonly logger = new Logger(DocTypeService.name);

  constructor(
    @InjectRepository(DocTypeEntity)
    private readonly docTypeRepository: Repository<DocTypeEntity>,
  ) {}

  async findAll(entityId: string): Promise<DocTypeEntity[]> {
    return this.docTypeRepository.find({
      where: { entId: entityId, dtpIsActive: true },
      order: { dtpCode: 'ASC' },
    });
  }

  async findOne(entityId: string, dtpId: string): Promise<DocTypeEntity> {
    const docType = await this.docTypeRepository.findOne({
      where: { dtpId, entId: entityId, dtpIsActive: true },
      relations: ['parentType'],
    });
    if (!docType) {
      throw new NotFoundException(`DocType ${dtpId} not found`);
    }
    return docType;
  }

  async findByCode(entityId: string, code: string): Promise<DocTypeEntity | null> {
    return this.docTypeRepository.findOne({
      where: { entId: entityId, dtpCode: code, dtpIsActive: true },
    });
  }

  async getInheritedBaseDataRefs(entityId: string, dtpId: string): Promise<string[]> {
    const docType = await this.findOne(entityId, dtpId);
    const refs = new Set<string>(docType.dtpBaseDataRefs || []);

    if (docType.dtpInheritsFrom) {
      const parent = await this.findOne(entityId, docType.dtpInheritsFrom);
      if (parent.dtpBaseDataRefs) {
        for (const ref of parent.dtpBaseDataRefs) {
          refs.add(ref);
        }
      }
    }

    return Array.from(refs);
  }
}
