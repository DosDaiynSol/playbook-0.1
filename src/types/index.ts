export type TaskComplexity = 1 | 2 | 3; // 1 (Green), 2 (Yellow), 3 (Red)
export type TaskStatus = 'pending' | 'completed';
export type ContextTag = 'Morning' | 'Day' | 'Evening' | 'Any';

export interface Task {
  id: string;
  title: string;
  description?: string;
  complexity: TaskComplexity;
  status: TaskStatus;
  contextTag: ContextTag;
  createdAt: number;
  completedAt?: number;
  sprintId?: string;
}

export type RewardTier = 'bronze' | 'silver' | 'gold';

export interface Reward {
  id: string;
  title: string;
  cost: number;
  tier: RewardTier;
  isRedeemed: boolean;
  isLocked: boolean; // Default true
  image?: string;
}

export interface Sprint {
  id: string;
  state: 'active' | 'completed';
  taskIds: string[]; // Max 3
  rewardId: string | null;
  startTime: number;
}

export type ActionType =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_COMPLETED'
  | 'TASK_DELETED'
  | 'REWARD_CREATED'
  | 'REWARD_EARNED'
  | 'SPRINT_DEPLOYED'
  | 'SYSTEM_MESSAGE'
  | 'USER_NOTE';

export interface ActionLog {
  id: string;
  type: ActionType;
  content: string;
  metadata?: {
    taskId?: string;
    rewardId?: string;
    widgetData?: any;
  };
  timestamp: number;
}
