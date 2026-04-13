import { PartialType } from '@nestjs/swagger';
import { CreateAssetRequestRequest } from './create-asset-request.request';

export class UpdateAssetRequestRequest extends PartialType(CreateAssetRequestRequest) {}
