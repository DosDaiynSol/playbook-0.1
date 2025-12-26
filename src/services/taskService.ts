import { supabase } from '../lib/supabase';
import { Task, Reward, Sprint, TaskComplexity, ContextTag } from '../types';

/**
 * Task Service Layer
 * 
 * Handles all Supabase API interactions for tasks, sprints, and rewards.
 * Store should only call these methods, never access supabase directly.
 */

// ==================== FETCH OPERATIONS ====================

export const taskService = {
    /**
     * Fetch all tasks for a specific user
     */
    async fetchTasks(userId: string) {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Fetch all rewards (no user filter - column doesn't exist yet)
     */
    async fetchRewards() {
        const { data, error } = await supabase
            .from('rewards')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Fetch active sprint
     */
    async fetchActiveSprint() {
        const { data, error } = await supabase
            .from('sprints')
            .select('*')
            .eq('state', 'active')
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    // ==================== TASK OPERATIONS ====================

    /**
     * Create a new task
     */
    async createTask(title: string, complexity: TaskComplexity, contextTag: ContextTag, userId: string) {
        const { data, error } = await supabase
            .from('tasks')
            .insert({
                title,
                complexity,
                tags: [contextTag],
                status: 'pending',
                user_id: userId,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update task fields
     */
    async updateTask(taskId: string, updates: {
        title?: string;
        complexity?: TaskComplexity;
        status?: 'pending' | 'completed';
        completedAt?: string | null;
        sprintId?: string | null;
    }) {
        const dbUpdates: any = {};
        if (updates.title) dbUpdates.title = updates.title;
        if (updates.complexity) dbUpdates.complexity = updates.complexity;
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
        if (updates.sprintId !== undefined) dbUpdates.sprint_id = updates.sprintId;

        const { data, error } = await supabase
            .from('tasks')
            .update(dbUpdates)
            .eq('id', taskId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Toggle task status (pending <-> completed)
     */
    async toggleTaskStatus(taskId: string, currentStatus: 'pending' | 'completed') {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

        const { error } = await supabase
            .from('tasks')
            .update({
                status: newStatus,
                completed_at: completedAt
            })
            .eq('id', taskId);

        if (error) throw error;
        return { newStatus, completedAt };
    },

    /**
     * Delete a task
     */
    async deleteTask(taskId: string) {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);

        if (error) throw error;
    },

    /**
     * Update multiple tasks' sprint_id
     */
    async linkTasksToSprint(taskIds: string[], sprintId: string) {
        const { error } = await supabase
            .from('tasks')
            .update({ sprint_id: sprintId })
            .in('id', taskIds);

        if (error) throw error;
    },

    // ==================== SPRINT OPERATIONS ====================

    /**
     * Create a new sprint
     */
    async createSprint(taskIds: string[], rewardId: string | null, userId: string) {
        const { data, error } = await supabase
            .from('sprints')
            .insert({
                state: 'active',
                task_ids: taskIds,
                reward_id: rewardId,
                user_id: userId,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update sprint (e.g., assign reward, complete)
     */
    async updateSprint(sprintId: string, updates: {
        state?: 'active' | 'completed';
        rewardId?: string;
        endTime?: string;
    }) {
        const dbUpdates: any = {};
        if (updates.state) dbUpdates.state = updates.state;
        if (updates.rewardId) dbUpdates.reward_id = updates.rewardId;
        if (updates.endTime) dbUpdates.end_time = updates.endTime;

        const { error } = await supabase
            .from('sprints')
            .update(dbUpdates)
            .eq('id', sprintId);

        if (error) throw error;
    },

    /**
     * Complete a sprint
     */
    async completeSprint(sprintId: string) {
        const { error } = await supabase
            .from('sprints')
            .update({
                state: 'completed',
                end_time: new Date().toISOString()
            })
            .eq('id', sprintId);

        if (error) throw error;
    },

    // ==================== REWARD OPERATIONS ====================

    /**
     * Create a new reward
     */
    async createReward(reward: { title: string; cost: number; tier: string }) {
        const { data, error } = await supabase
            .from('rewards')
            .insert({
                title: reward.title,
                cost: reward.cost,
                tier: reward.tier,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Redeem a reward
     */
    async redeemReward(rewardId: string) {
        const { error } = await supabase
            .from('rewards')
            .update({ is_redeemed: true })
            .eq('id', rewardId);

        if (error) throw error;
    },
};
