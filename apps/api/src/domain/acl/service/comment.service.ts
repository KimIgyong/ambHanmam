import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, IsNull } from 'typeorm';
import { WorkItemCommentEntity } from '../entity/work-item-comment.entity';
import { WorkItemCommentResponse, CommentType } from '@amb/types';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(WorkItemCommentEntity)
    private readonly commentRepository: Repository<WorkItemCommentEntity>,
  ) {}

  async addComment(params: {
    workItemId: string;
    authorId: string;
    content: string;
    type?: string;
    parentId?: string;
    isPrivate?: boolean;
  }): Promise<WorkItemCommentResponse> {
    const entity = this.commentRepository.create({
      witId: params.workItemId,
      wicAuthorId: params.authorId,
      wicContent: params.content,
      wicType: params.type || 'COMMENT',
      wicParentId: params.parentId || undefined,
      wicIsPrivate: params.isPrivate || false,
    } as DeepPartial<WorkItemCommentEntity>);

    const saved: WorkItemCommentEntity = await this.commentRepository.save(entity as WorkItemCommentEntity);
    return this.getById(saved.wicId);
  }

  async editComment(
    commentId: string,
    content: string,
    userId: string,
  ): Promise<WorkItemCommentResponse> {
    const entity = await this.commentRepository.findOne({ where: { wicId: commentId } });
    if (!entity) throw new NotFoundException('Comment not found.');
    if (entity.wicAuthorId !== userId) throw new ForbiddenException('Cannot edit this comment.');

    entity.wicContent = content;
    entity.wicIsEdited = true;
    await this.commentRepository.save(entity);
    return this.getById(commentId);
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const entity = await this.commentRepository.findOne({ where: { wicId: commentId } });
    if (!entity) throw new NotFoundException('Comment not found.');
    if (entity.wicAuthorId !== userId) throw new ForbiddenException('Cannot delete this comment.');

    entity.wicIsDeleted = true;
    await this.commentRepository.save(entity);
  }

  async getComments(workItemId: string): Promise<WorkItemCommentResponse[]> {
    const entities = await this.commentRepository.find({
      where: { witId: workItemId, wicParentId: IsNull(), wicIsDeleted: false },
      relations: ['author', 'replies', 'replies.author'],
      order: { wicCreatedAt: 'ASC' },
    });

    return entities.map((e) => this.toResponse(e));
  }

  private async getById(id: string): Promise<WorkItemCommentResponse> {
    const entity = await this.commentRepository.findOne({
      where: { wicId: id },
      relations: ['author', 'replies', 'replies.author'],
    });
    if (!entity) throw new NotFoundException('Comment not found.');
    return this.toResponse(entity);
  }

  private toResponse(entity: WorkItemCommentEntity): WorkItemCommentResponse {
    return {
      commentId: entity.wicId,
      workItemId: entity.witId,
      parentId: entity.wicParentId || null,
      authorId: entity.wicAuthorId,
      authorName: entity.author?.usrName || '',
      content: entity.wicIsDeleted ? '' : entity.wicContent,
      type: entity.wicType as CommentType,
      isPrivate: entity.wicIsPrivate,
      isEdited: entity.wicIsEdited,
      replies: entity.replies
        ?.filter((r) => !r.wicIsDeleted)
        ?.map((r) => this.toResponse(r)),
      createdAt: entity.wicCreatedAt?.toISOString(),
      updatedAt: entity.wicUpdatedAt?.toISOString(),
    };
  }
}
