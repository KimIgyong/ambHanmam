import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from '../../project/entity/project.entity';
import { IssueEntity } from '../../issues/entity/issue.entity';
import { TodoEntity } from '../../todo/entity/todo.entity';
import { MeetingNoteEntity } from '../../meeting-notes/entity/meeting-note.entity';
import { ProjectEpicEntity } from '../../project/entity/project-epic.entity';
import { ProjectComponentEntity } from '../../project/entity/project-component.entity';
import { MeetingNoteProjectEntity } from '../../meeting-notes/entity/meeting-note-project.entity';
import { MeetingNoteIssueEntity } from '../../meeting-notes/entity/meeting-note-issue.entity';
import { NoteLinkEntity } from '../../meeting-notes/entity/note-link.entity';

interface AmbGraphNode {
  id: string;
  type: string;
  label: string;
}

interface AmbGraphEdge {
  source: string;
  target: string;
  relation: string;
}

export interface AmbGraphResponse {
  nodes: AmbGraphNode[];
  edges: AmbGraphEdge[];
}

@Injectable()
export class AmbGraphService {
  private readonly logger = new Logger(AmbGraphService.name);

  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(IssueEntity)
    private readonly issueRepo: Repository<IssueEntity>,
    @InjectRepository(TodoEntity)
    private readonly todoRepo: Repository<TodoEntity>,
    @InjectRepository(MeetingNoteEntity)
    private readonly noteRepo: Repository<MeetingNoteEntity>,
    @InjectRepository(ProjectEpicEntity)
    private readonly epicRepo: Repository<ProjectEpicEntity>,
    @InjectRepository(ProjectComponentEntity)
    private readonly componentRepo: Repository<ProjectComponentEntity>,
    @InjectRepository(MeetingNoteProjectEntity)
    private readonly noteProjectRepo: Repository<MeetingNoteProjectEntity>,
    @InjectRepository(MeetingNoteIssueEntity)
    private readonly noteIssueRepo: Repository<MeetingNoteIssueEntity>,
    @InjectRepository(NoteLinkEntity)
    private readonly noteLinkRepo: Repository<NoteLinkEntity>,
  ) {}

  async getGraphData(params: {
    entityId: string;
    userId: string;
    scope: 'MY' | 'ENTITY';
    types?: string[];
  }): Promise<AmbGraphResponse> {
    const { entityId, userId, scope, types } = params;
    const nodeMap = new Map<string, AmbGraphNode>();
    const edges: AmbGraphEdge[] = [];

    const activeTypes = types && types.length > 0
      ? new Set(types)
      : new Set(['PROJECT', 'ISSUE', 'TODO', 'NOTE', 'EPIC', 'COMPONENT']);

    // 1. Projects
    if (activeTypes.has('PROJECT')) {
      const projects = await this.loadProjects(entityId, userId, scope);
      for (const p of projects) {
        nodeMap.set(p.pjtId, { id: p.pjtId, type: 'PROJECT', label: p.pjtName || p.pjtCode });
        if (p.pjtParentId && !nodeMap.has(p.pjtParentId)) {
          // Parent will be added if it's in the dataset
        }
      }
      // Parent-child project edges
      for (const p of projects) {
        if (p.pjtParentId && nodeMap.has(p.pjtParentId)) {
          edges.push({ source: p.pjtId, target: p.pjtParentId, relation: 'PARENT_PROJECT' });
        }
      }
    }

    // 2. Epics
    if (activeTypes.has('EPIC')) {
      const epics = await this.loadEpics(entityId);
      for (const e of epics) {
        nodeMap.set(e.epcId, { id: e.epcId, type: 'EPIC', label: e.epcTitle });
        if (activeTypes.has('PROJECT') && e.pjtId && nodeMap.has(e.pjtId)) {
          edges.push({ source: e.epcId, target: e.pjtId, relation: 'FK' });
        }
      }
    }

    // 3. Components
    if (activeTypes.has('COMPONENT')) {
      const components = await this.loadComponents(entityId);
      for (const c of components) {
        nodeMap.set(c.cmpId, { id: c.cmpId, type: 'COMPONENT', label: c.cmpTitle });
        if (activeTypes.has('PROJECT') && c.pjtId && nodeMap.has(c.pjtId)) {
          edges.push({ source: c.cmpId, target: c.pjtId, relation: 'FK' });
        }
      }
    }

    // 4. Issues
    if (activeTypes.has('ISSUE')) {
      const issues = await this.loadIssues(entityId, userId, scope);
      for (const i of issues) {
        nodeMap.set(i.issId, { id: i.issId, type: 'ISSUE', label: i.issTitle });
      }
      for (const i of issues) {
        if (i.pjtId && nodeMap.has(i.pjtId)) {
          edges.push({ source: i.issId, target: i.pjtId, relation: 'FK' });
        }
        if (i.issParentId && nodeMap.has(i.issParentId)) {
          edges.push({ source: i.issId, target: i.issParentId, relation: 'PARENT_ISSUE' });
        }
        if (i.epcId && nodeMap.has(i.epcId)) {
          edges.push({ source: i.issId, target: i.epcId, relation: 'FK' });
        }
        if (i.cmpId && nodeMap.has(i.cmpId)) {
          edges.push({ source: i.issId, target: i.cmpId, relation: 'FK' });
        }
      }
    }

    // 5. Todos
    if (activeTypes.has('TODO')) {
      const todos = await this.loadTodos(entityId, userId, scope);
      for (const t of todos) {
        nodeMap.set(t.tdoId, { id: t.tdoId, type: 'TODO', label: t.tdoTitle });
      }
      for (const t of todos) {
        if (t.pjtId && nodeMap.has(t.pjtId)) {
          edges.push({ source: t.tdoId, target: t.pjtId, relation: 'FK' });
        }
        if (t.issId && nodeMap.has(t.issId)) {
          edges.push({ source: t.tdoId, target: t.issId, relation: 'FK' });
        }
        if (t.tdoParentId && nodeMap.has(t.tdoParentId)) {
          edges.push({ source: t.tdoId, target: t.tdoParentId, relation: 'PARENT_TODO' });
        }
      }
    }

    // 6. Meeting Notes
    if (activeTypes.has('NOTE')) {
      const notes = await this.loadNotes(entityId, userId, scope);
      for (const n of notes) {
        nodeMap.set(n.mtnId, { id: n.mtnId, type: 'NOTE', label: n.mtnTitle });
      }

      // Note ↔ Project junction
      if (activeTypes.has('PROJECT')) {
        const noteProjects = await this.noteProjectRepo
          .createQueryBuilder('np')
          .innerJoin('np.meetingNote', 'note')
          .where('note.entId = :entityId', { entityId })
          .andWhere('note.mtnDeletedAt IS NULL')
          .select(['np.mnpId', 'np.mtnId', 'np.pjtId'])
          .getMany();

        for (const np of noteProjects) {
          if (nodeMap.has(np.mtnId) && nodeMap.has(np.pjtId)) {
            edges.push({ source: np.mtnId, target: np.pjtId, relation: 'FK' });
          }
        }
      }

      // Note ↔ Issue junction
      if (activeTypes.has('ISSUE')) {
        const noteIssues = await this.noteIssueRepo
          .createQueryBuilder('ni')
          .innerJoin('ni.meetingNote', 'note')
          .where('note.entId = :entityId', { entityId })
          .andWhere('note.mtnDeletedAt IS NULL')
          .select(['ni.mniId', 'ni.mtnId', 'ni.issId'])
          .getMany();

        for (const ni of noteIssues) {
          if (nodeMap.has(ni.mtnId) && nodeMap.has(ni.issId)) {
            edges.push({ source: ni.mtnId, target: ni.issId, relation: 'FK' });
          }
        }
      }
    }

    // 7. Wiki-link edges (amb_note_links)
    const wikiLinks = await this.loadWikiLinks(entityId, userId, scope);
    for (const link of wikiLinks) {
      const sourceId = link.nlkSourceNoteId;
      const targetId = link.nlkTargetType === 'NOTE'
        ? link.nlkTargetNoteId
        : link.nlkTargetRefId;

      if (!targetId) continue;
      if (!nodeMap.has(sourceId)) continue;

      // If target node doesn't exist in nodeMap, add it with linkText as label
      if (!nodeMap.has(targetId)) {
        const targetType = this.mapWikiTargetType(link.nlkTargetType);
        if (!activeTypes.has(targetType)) continue;
        nodeMap.set(targetId, { id: targetId, type: targetType, label: link.nlkLinkText });
      }

      edges.push({ source: sourceId, target: targetId, relation: 'WIKI_LINK' });
    }

    // Limit nodes
    const nodes = Array.from(nodeMap.values()).slice(0, 500);
    const nodeIds = new Set(nodes.map((n) => n.id));
    const filteredEdges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

    return { nodes, edges: filteredEdges };
  }

  private mapWikiTargetType(nlkTargetType: string): string {
    switch (nlkTargetType) {
      case 'TASK': return 'TODO';
      case 'MISSION': return 'NOTE'; // Missions don't have a separate node type, map to NOTE
      default: return nlkTargetType; // NOTE, ISSUE, PROJECT
    }
  }

  private async loadProjects(entityId: string, userId: string, scope: 'MY' | 'ENTITY') {
    const qb = this.projectRepo
      .createQueryBuilder('p')
      .select(['p.pjtId', 'p.pjtName', 'p.pjtCode', 'p.pjtParentId'])
      .where('p.entId = :entityId', { entityId })
      .andWhere('p.pjtDeletedAt IS NULL');

    if (scope === 'MY') {
      qb.andWhere('(p.pjtManagerId = :userId OR p.pjtProposerId = :userId)', { userId });
    }
    return qb.take(200).getMany();
  }

  private async loadEpics(entityId: string) {
    return this.epicRepo
      .createQueryBuilder('e')
      .select(['e.epcId', 'e.epcTitle', 'e.pjtId'])
      .where('e.entId = :entityId', { entityId })
      .andWhere('e.epcDeletedAt IS NULL')
      .take(200)
      .getMany();
  }

  private async loadComponents(entityId: string) {
    return this.componentRepo
      .createQueryBuilder('c')
      .select(['c.cmpId', 'c.cmpTitle', 'c.pjtId'])
      .where('c.entId = :entityId', { entityId })
      .andWhere('c.cmpDeletedAt IS NULL')
      .take(200)
      .getMany();
  }

  private async loadIssues(entityId: string, userId: string, scope: 'MY' | 'ENTITY') {
    const qb = this.issueRepo
      .createQueryBuilder('i')
      .select(['i.issId', 'i.issTitle', 'i.pjtId', 'i.issParentId', 'i.epcId', 'i.cmpId'])
      .where('i.entId = :entityId', { entityId })
      .andWhere('i.issDeletedAt IS NULL');

    if (scope === 'MY') {
      qb.andWhere('(i.issReporterId = :userId OR i.issAssigneeId = :userId)', { userId });
    }
    return qb.take(300).getMany();
  }

  private async loadTodos(entityId: string, userId: string, scope: 'MY' | 'ENTITY') {
    const qb = this.todoRepo
      .createQueryBuilder('t')
      .select(['t.tdoId', 't.tdoTitle', 't.pjtId', 't.issId', 't.tdoParentId'])
      .where('t.entId = :entityId', { entityId })
      .andWhere('t.tdoDeletedAt IS NULL');

    if (scope === 'MY') {
      qb.andWhere('t.usrId = :userId', { userId });
    }
    return qb.take(300).getMany();
  }

  private async loadNotes(entityId: string, userId: string, scope: 'MY' | 'ENTITY') {
    const qb = this.noteRepo
      .createQueryBuilder('n')
      .select(['n.mtnId', 'n.mtnTitle'])
      .where('n.entId = :entityId', { entityId })
      .andWhere('n.mtnDeletedAt IS NULL');

    if (scope === 'MY') {
      qb.andWhere('n.usrId = :userId', { userId });
    }
    return qb.take(300).getMany();
  }

  private async loadWikiLinks(entityId: string, userId: string, scope: 'MY' | 'ENTITY') {
    const qb = this.noteLinkRepo
      .createQueryBuilder('link')
      .innerJoin('link.sourceNote', 'source')
      .select([
        'link.nlkId',
        'link.nlkSourceNoteId',
        'link.nlkTargetNoteId',
        'link.nlkTargetType',
        'link.nlkTargetRefId',
        'link.nlkLinkText',
      ])
      .where('link.entId = :entityId', { entityId })
      .andWhere('source.mtnDeletedAt IS NULL');

    if (scope === 'MY') {
      qb.andWhere('source.usrId = :userId', { userId });
    }
    return qb.take(500).getMany();
  }
}
