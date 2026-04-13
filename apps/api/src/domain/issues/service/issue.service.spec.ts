/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IssueService } from './issue.service';
import { IssueEntity } from '../entity/issue.entity';
import { IssueCommentEntity } from '../entity/issue-comment.entity';
import { IssueStatusLogEntity } from '../entity/issue-status-log.entity';
import { BusinessException } from '../../../global/filter/business.exception';
import { createMockRepository, createMockQueryBuilder, createMockEventEmitter } from '../../../test/mock.helper';

describe('IssueService', () => {
  let service: IssueService;
  let issueRepo: ReturnType<typeof createMockRepository>;
  let commentRepo: ReturnType<typeof createMockRepository>;
  let statusLogRepo: ReturnType<typeof createMockRepository>;
  let eventEmitter: ReturnType<typeof createMockEventEmitter>;

  const mockIssue = {
    issId: 'iss-1',
    entId: 'ent-1',
    issType: 'BUG',
    issTitle: 'Login bug',
    issDescription: 'Login fails on Safari',
    issSeverity: 'MAJOR',
    issStatus: 'OPEN',
    issPriority: 2,
    issReporterId: 'user-1',
    issAssignee: null,
    issGithubId: null,
    issAffectedModules: ['auth'],
    issResolution: null,
    issAiAnalysis: null,
    issResolvedAt: null,
    issCreatedAt: new Date('2026-01-01'),
    issUpdatedAt: new Date('2026-01-01'),
    issDeletedAt: null,
    reporter: { usrName: 'Test User' },
  } as any;

  const mockComment = {
    iscId: 'isc-1',
    issId: 'iss-1',
    iscAuthorId: 'user-1',
    iscAuthorType: 'USER',
    iscContent: 'Test comment',
    iscCreatedAt: new Date('2026-01-02'),
    author: { usrName: 'Test User' },
  } as any;

  beforeEach(async () => {
    issueRepo = createMockRepository();
    commentRepo = createMockRepository();
    statusLogRepo = createMockRepository();
    eventEmitter = createMockEventEmitter();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IssueService,
        { provide: getRepositoryToken(IssueEntity), useValue: issueRepo },
        { provide: getRepositoryToken(IssueCommentEntity), useValue: commentRepo },
        { provide: getRepositoryToken(IssueStatusLogEntity), useValue: statusLogRepo },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<IssueService>(IssueService);
  });

  describe('getIssues', () => {
    it('should return paginated issues with filters', async () => {
      const qb = createMockQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[mockIssue], 1]);
      issueRepo.createQueryBuilder.mockReturnValue(qb);

      const commentQb = createMockQueryBuilder();
      commentQb.getRawMany.mockResolvedValue([{ issId: 'iss-1', count: '3' }]);
      commentRepo.createQueryBuilder.mockReturnValue(commentQb);

      const result = await service.getIssues({ type: 'BUG', status: 'OPEN' }, 1, 20);

      expect(result.totalCount).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].issueId).toBe('iss-1');
      expect(result.data[0].commentCount).toBe(3);
    });
  });

  describe('getIssueById', () => {
    it('should return issue with comment count', async () => {
      issueRepo.findOne.mockResolvedValue(mockIssue);
      commentRepo.count.mockResolvedValue(5);

      const result = await service.getIssueById('iss-1');

      expect(result.issueId).toBe('iss-1');
      expect(result.commentCount).toBe(5);
    });

    it('should throw when issue not found', async () => {
      issueRepo.findOne.mockResolvedValue(null);

      await expect(service.getIssueById('iss-999'))
        .rejects.toThrow(BusinessException);
    });
  });

  describe('createIssue', () => {
    it('should create a new issue with OPEN status', async () => {
      const dto = {
        type: 'BUG',
        title: 'New Bug',
        description: 'Bug description',
        severity: 'MAJOR',
        priority: 2,
        affected_modules: ['auth'],
      } as any;

      const created = { ...mockIssue, issId: 'iss-new', issTitle: 'New Bug' };
      issueRepo.create.mockReturnValue(created);
      issueRepo.save.mockResolvedValue(created);
      issueRepo.findOne.mockResolvedValue(created);
      commentRepo.count.mockResolvedValue(0);

      const result = await service.createIssue(dto, 'user-1', 'ent-1');

      expect(result.title).toBe('New Bug');
      expect(result.status).toBe('OPEN');
      expect(eventEmitter.emit).toHaveBeenCalled();
    });
  });

  describe('updateIssue', () => {
    it('should update issue fields', async () => {
      issueRepo.findOne.mockResolvedValue({ ...mockIssue });
      issueRepo.save.mockImplementation((e) => Promise.resolve(e));
      commentRepo.count.mockResolvedValue(0);

      const result = await service.updateIssue('iss-1', { title: 'Updated Bug' } as any, 'user-1');

      expect(result.title).toBe('Updated Bug');
      expect(eventEmitter.emit).toHaveBeenCalled();
    });

    it('should throw when issue not found', async () => {
      issueRepo.findOne.mockResolvedValue(null);

      await expect(service.updateIssue('iss-999', {} as any, 'user-1'))
        .rejects.toThrow(BusinessException);
    });
  });

  describe('updateIssueStatus', () => {
    it('should transition OPEN → APPROVED', async () => {
      issueRepo.findOne.mockResolvedValue({ ...mockIssue });
      issueRepo.save.mockImplementation((e) => Promise.resolve(e));
      commentRepo.count.mockResolvedValue(0);

      const result = await service.updateIssueStatus('iss-1', 'APPROVED', 'admin-1', 'Looks good');

      expect(result.status).toBe('APPROVED');
      expect(statusLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          islFromStatus: 'OPEN',
          islToStatus: 'APPROVED',
        }),
      );
    });

    it('should transition IN_PROGRESS → RESOLVED and set resolvedAt', async () => {
      const inProgressIssue = { ...mockIssue, issStatus: 'IN_PROGRESS' };
      issueRepo.findOne.mockResolvedValue(inProgressIssue);
      issueRepo.save.mockImplementation((e) => Promise.resolve(e));
      commentRepo.count.mockResolvedValue(0);

      const result = await service.updateIssueStatus('iss-1', 'RESOLVED', 'user-1');

      expect(result.status).toBe('RESOLVED');
      expect(result.resolvedAt).not.toBeNull();
    });

    it('should reject invalid transition OPEN → CLOSED', async () => {
      issueRepo.findOne.mockResolvedValue({ ...mockIssue });

      await expect(service.updateIssueStatus('iss-1', 'CLOSED', 'user-1'))
        .rejects.toThrow(BusinessException);
    });

    it('should reject invalid transition CLOSED → APPROVED', async () => {
      const closedIssue = { ...mockIssue, issStatus: 'CLOSED' };
      issueRepo.findOne.mockResolvedValue(closedIssue);

      await expect(service.updateIssueStatus('iss-1', 'APPROVED', 'user-1'))
        .rejects.toThrow(BusinessException);
    });

    it('should allow RESOLVED → OPEN (reopen) and clear resolvedAt', async () => {
      const resolvedIssue = { ...mockIssue, issStatus: 'RESOLVED', issResolvedAt: new Date() };
      issueRepo.findOne.mockResolvedValue(resolvedIssue);
      issueRepo.save.mockImplementation((e) => Promise.resolve(e));
      commentRepo.count.mockResolvedValue(0);

      const result = await service.updateIssueStatus('iss-1', 'OPEN', 'user-1');

      expect(result.status).toBe('OPEN');
      expect(result.resolvedAt).toBeNull();
    });
  });

  describe('deleteIssue', () => {
    it('should soft remove the issue', async () => {
      issueRepo.findOne.mockResolvedValue(mockIssue);

      await service.deleteIssue('iss-1');

      expect(issueRepo.softRemove).toHaveBeenCalledWith(mockIssue);
    });

    it('should throw when issue not found', async () => {
      issueRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteIssue('iss-999'))
        .rejects.toThrow(BusinessException);
    });
  });

  describe('getIssueComments', () => {
    it('should return comments for an issue', async () => {
      issueRepo.findOne.mockResolvedValue(mockIssue);
      commentRepo.find.mockResolvedValue([mockComment]);

      const result = await service.getIssueComments('iss-1');

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('Test comment');
    });

    it('should throw when issue not found', async () => {
      issueRepo.findOne.mockResolvedValue(null);

      await expect(service.getIssueComments('iss-999'))
        .rejects.toThrow(BusinessException);
    });
  });

  describe('addIssueComment', () => {
    it('should add a comment to an issue', async () => {
      issueRepo.findOne.mockResolvedValue(mockIssue);
      commentRepo.create.mockReturnValue(mockComment);
      commentRepo.save.mockResolvedValue(mockComment);
      commentRepo.findOne.mockResolvedValue(mockComment);

      const result = await service.addIssueComment('iss-1', 'Test comment', 'user-1');

      expect(result.content).toBe('Test comment');
      expect(result.authorType).toBe('USER');
    });
  });

  describe('deleteIssueComment', () => {
    it('should remove the comment', async () => {
      commentRepo.findOne.mockResolvedValue(mockComment);

      await service.deleteIssueComment('isc-1', 'user-1');

      expect(commentRepo.remove).toHaveBeenCalledWith(mockComment);
    });

    it('should throw when comment not found', async () => {
      commentRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteIssueComment('isc-999', 'user-1'))
        .rejects.toThrow(BusinessException);
    });
  });

  describe('getIssueStatusLogs', () => {
    it('should return status change history', async () => {
      issueRepo.findOne.mockResolvedValue(mockIssue);
      const mockLog = {
        islId: 'isl-1',
        issId: 'iss-1',
        islFromStatus: 'OPEN',
        islToStatus: 'APPROVED',
        islChangedBy: 'admin-1',
        islNote: 'Approved',
        islCreatedAt: new Date('2026-01-03'),
        changedByUser: { usrName: 'Admin' },
      } as any;
      statusLogRepo.find.mockResolvedValue([mockLog]);

      const result = await service.getIssueStatusLogs('iss-1');

      expect(result).toHaveLength(1);
      expect(result[0].fromStatus).toBe('OPEN');
      expect(result[0].toStatus).toBe('APPROVED');
    });
  });
});
