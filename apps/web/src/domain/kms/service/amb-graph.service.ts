import { apiClient } from '@/lib/api-client';

export interface AmbGraphNode {
  id: string;
  type: string;
  label: string;
}

export interface AmbGraphEdge {
  source: string;
  target: string;
  relation: string;
}

export interface AmbGraphData {
  nodes: AmbGraphNode[];
  edges: AmbGraphEdge[];
}

class AmbGraphService {
  private readonly basePath = '/kms';

  getGraphData = (params?: { scope?: string; types?: string }) =>
    apiClient
      .get<{ success: boolean; data: AmbGraphData }>(`${this.basePath}/amb-graph`, { params })
      .then((r) => r.data.data);
}

export const ambGraphService = new AmbGraphService();
