/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * TypeORM Repository 목 생성 헬퍼
 */
export const createMockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  softDelete: jest.fn(),
  softRemove: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    withDeleted: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
    getCount: jest.fn(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
    execute: jest.fn(),
    groupBy: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
  }),
});

/**
 * QueryBuilder 별도 목 생성 (createQueryBuilder가 반환할 목)
 */
export const createMockQueryBuilder = () => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orWhere: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  innerJoinAndSelect: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  withDeleted: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
  getMany: jest.fn(),
  getManyAndCount: jest.fn(),
  getCount: jest.fn(),
  getRawOne: jest.fn(),
  getRawMany: jest.fn(),
  execute: jest.fn(),
  groupBy: jest.fn().mockReturnThis(),
  having: jest.fn().mockReturnThis(),
});

/**
 * EventEmitter2 목 생성 헬퍼
 */
export const createMockEventEmitter = () => ({
  emit: jest.fn(),
  emitAsync: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  off: jest.fn(),
});

/**
 * MailService 목 생성 헬퍼
 */
export const createMockMailService = () => ({
  sendMail: jest.fn().mockResolvedValue(undefined),
  sendExpenseApprovalNotification: jest.fn().mockResolvedValue(undefined),
  sendExpenseRejectionNotification: jest.fn().mockResolvedValue(undefined),
});
