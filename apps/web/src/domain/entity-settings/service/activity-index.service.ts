import { apiClient } from '@/lib/api-client';

export interface ActivityWeightConfig {
  category: string;
  weight: number;
  engagementWeight: number;
  dailyCap: number;
}

export interface MemberActivityStat {
  userId: string;
  userName: string;
  unit: string;
  totalIssues: number;
  totalNotes: number;
  totalComments: number;
  totalTodos: number;
  totalChats: number;
  activityScore: number;
  engagementScore: number;
  totalScore: number;
  avgRating: number;
  ratingCount: number;
}

export interface UserDailyStat {
  date: string;
  issueCount: number;
  noteCount: number;
  commentCount: number;
  todoCount: number;
  chatCount: number;
  activityScore: number;
  engagementScore: number;
  totalScore: number;
}

export interface MyEngagement {
  received: {
    ratingTotal: number;
    ratingCount: number;
    ratingAvg: number;
    reactionCount: number;
  };
  given: {
    ratingCount: number;
    reactionCount: number;
  };
}

export interface MyYesterdayActivity {
  date: string;
  issues: { id: string; title: string }[];
  statusChanges: { issueId: string; issueTitle: string; toStatus: string }[];
  todos: { id: string; title: string }[];
  notes: { id: string; title: string }[];
  commentCount: number;
}

class ActivityIndexService {
  private readonly basePath = '/activity-stats';
  private readonly weightsPath = '/activity-weights';

  getWeights = () =>
    apiClient
      .get<{ success: boolean; data: ActivityWeightConfig[] }>(`${this.weightsPath}`)
      .then((r: { data: { data: ActivityWeightConfig[] } }) => r.data.data);

  updateWeights = (weights: ActivityWeightConfig[]) =>
    apiClient.put(`${this.weightsPath}`, { weights });

  getMemberStats = (params: { date_from?: string; date_to?: string }) =>
    apiClient
      .get<{ success: boolean; data: MemberActivityStat[] }>(`${this.basePath}/summary`, { params })
      .then((r: { data: { data: MemberActivityStat[] } }) => r.data.data);

  getUserDailyStats = (userId: string, params: { date_from?: string; date_to?: string }) =>
    apiClient
      .get<{ success: boolean; data: UserDailyStat[] }>(`${this.basePath}/${userId}/daily`, { params })
      .then((r: { data: { data: UserDailyStat[] } }) => r.data.data);

  aggregate = (date: string) =>
    apiClient.post(`${this.basePath}/aggregate`, { date });

  getMyEngagement = () =>
    apiClient
      .get<{ success: boolean; data: MyEngagement }>(`${this.basePath}/my-engagement`)
      .then((r: { data: { data: MyEngagement } }) => r.data.data);

  getMyYesterday = () =>
    apiClient
      .get<{ success: boolean; data: MyYesterdayActivity }>(`${this.basePath}/my-yesterday`)
      .then((r: { data: { data: MyYesterdayActivity } }) => r.data.data);
}

export const activityIndexService = new ActivityIndexService();
