import { Injectable, BadRequestException } from '@nestjs/common';
import { ExternalTaskProviderType } from '@amb/types';
import { ExternalTaskProvider } from '../interface/external-task-provider.interface';
import { AsanaProvider } from './asana.provider';
import { RedmineProvider } from './redmine.provider';

@Injectable()
export class ProviderRegistry {
  private readonly providers: Map<string, ExternalTaskProvider>;

  constructor(
    private readonly asana: AsanaProvider,
    private readonly redmine: RedmineProvider,
  ) {
    this.providers = new Map<string, ExternalTaskProvider>([
      ['asana', asana],
      ['redmine', redmine],
    ]);
  }

  getProvider(type: string): ExternalTaskProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new BadRequestException(`Unsupported provider: ${type}`);
    }
    return provider;
  }

  getSupportedTypes(): ExternalTaskProviderType[] {
    return Array.from(this.providers.keys()) as ExternalTaskProviderType[];
  }
}
