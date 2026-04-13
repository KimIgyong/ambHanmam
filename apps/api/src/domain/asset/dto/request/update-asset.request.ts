import { PartialType } from '@nestjs/swagger';
import { CreateAssetRequest } from './create-asset.request';

export class UpdateAssetRequest extends PartialType(CreateAssetRequest) {}
