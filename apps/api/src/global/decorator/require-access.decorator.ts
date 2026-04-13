import { SetMetadata } from '@nestjs/common';

export const REQUIRE_ACCESS_KEY = 'require_access_permission';

export const RequireAccess = (permission: 'VIEW' | 'COMMENT' | 'EDIT' | 'ADMIN') =>
  SetMetadata(REQUIRE_ACCESS_KEY, permission);
