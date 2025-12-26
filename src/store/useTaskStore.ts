import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Task, Sprint, Reward, TaskComplexity, ContextTag } from '../types';

interface PlaybookState {
    tasks: Task[];
    rewards: Reward[];
    currentSprint: Sprint | null;
    score: number;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchInitialData: () => Promise<void>;

    addTask: (title: string, complexity: TaskComplexity, contextTag: ContextTag) => Promise<void>;
    updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
    toggleTaskStatus: (taskId: string) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;

    createSprint: (taskIds: string[], rewardId: string) => Promise<void>;
    completeSprint: () => Promise<void>;

    addReward: (reward: Reward) => Promise<void>;
    redeemReward: (rewardId: string) => Promise<void>;

    // New Actions from Spec
    rerollTask: (oldTaskId: string) => Promise<void>;
}

export const useTaskStore = create<PlaybookState>((set, get) => ({
    tasks: [],
    rewards: [],
    currentSprint: null,
    score: 0,
    isLoading: false,
    error: null,

    fetchInitialData: async () => {
        set({ isLoading: true, error: null });
        try {
            // 1. Fetch Tasks
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false });

            if (tasksError) throw tasksError;

            // 2. Fetch Rewards
            const { data: rewardsData, error: rewardsError } = await supabase
                .from('rewards')
                .select('*')
                .order('created_at', { ascending: false });

            if (rewardsError) throw rewardsError;

            // 3. Fetch Active Sprint
            const { data: sprintsData, error: sprintsError } = await supabase
                .from('sprints')
                .select('*')
                .eq('state', 'active')
                .limit(1)
                .maybeSingle(); // Use maybeSingle to avoid 406 if no active sprint

            if (sprintsError) throw sprintsError;

            // --- Transform Data ---
            const tasks: Task[] = (tasksData || []).map((t: any) => ({
                id: t.id,
                title: t.title,
                complexity: t.complexity,
                status: t.status,
                contextTag: t.tags?.[0] || 'Any', // DB has tags[], we use first as context
                createdAt: new Date(t.created_at).getTime(),
                completedAt: t.completed_at ? new Date(t.completed_at).getTime() : undefined,
                sprintId: t.sprint_id,
            }));

            const rewards: Reward[] = (rewardsData || []).map((r: any) => ({
                id: r.id,
                title: r.title,
                cost: r.cost,
                tier: r.tier,
                isRedeemed: r.is_redeemed,
                isLocked: r.is_locked ?? true, // Default to locked
            }));

            let currentSprint: Sprint | null = null;
            if (sprintsData) {
                currentSprint = {
                    id: sprintsData.id,
                    state: sprintsData.state,
                    taskIds: sprintsData.task_ids || [], // Note: DB uses text[]
                    rewardId: sprintsData.reward_id,
                    startTime: new Date(sprintsData.start_time).getTime(),
                };
            }

            // Calculate Score (Simple logic: All stats based on history not implemented fully yet, 
            // just summing active points might be tricky without full history.
            // For now, let's just reset score to 0 on reload or calculate from completed tasks?)
            // Re-calculating score from local tasks for now:
            const score = tasks
                .filter(t => t.status === 'completed')
                .reduce((acc, t) => acc + t.complexity, 0)
                -
                rewards
                    .filter(r => r.isRedeemed)
                    .reduce((acc, r) => acc + r.cost, 0);

            set({ tasks, rewards, currentSprint, score: Math.max(score, 0), isLoading: false });

        } catch (error: any) {
            console.error('Fetch Error:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    addTask: async (title, complexity, contextTag) => {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .insert({
                    title,
                    complexity,
                    tags: [contextTag], // Store context as single tag for now
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            const newTask: Task = {
                id: data.id,
                title: data.title,
                complexity: data.complexity,
                status: data.status,
                contextTag: contextTag,
                createdAt: new Date(data.created_at).getTime(),
            };

            set((state) => ({ tasks: [newTask, ...state.tasks] }));
        } catch (e: any) {
            console.error('Add Task Error:', e);
        }
    },

    updateTask: async (taskId, updates) => {
        // Optimistic Update
        const previousTasks = get().tasks;
        set((state) => ({
            tasks: state.tasks.map((t) => t.id === taskId ? { ...t, ...updates } : t)
        }));

        try {
            // Map camelCase updates to snake_case for DB
            const dbUpdates: any = {};
            if (updates.title) dbUpdates.title = updates.title;
            if (updates.status) dbUpdates.status = updates.status;
            if (updates.contextTag) dbUpdates.tags = [updates.contextTag];

            const { error } = await supabase
                .from('tasks')
                .update(dbUpdates)
                .eq('id', taskId);

            if (error) throw error;
        } catch (e) {
            console.error(e);
            set({ tasks: previousTasks }); // Revert
        }
    },

    toggleTaskStatus: async (taskId) => {
        const state = get();
        const task = state.tasks.find(t => t.id === taskId);
        if (!task) return;

        const isCompleting = task.status !== 'completed';
        const newStatus = isCompleting ? 'completed' : 'pending';
        const completedAt = isCompleting ? new Date().toISOString() : null; // DB expects ISO string or null

        // Optimistic Update
        set(s => ({
            tasks: s.tasks.map(t => t.id === taskId ? {
                ...t,
                status: newStatus,
                completedAt: isCompleting ? Date.now() : undefined
            } : t),
            score: s.score + (isCompleting ? task.complexity : -task.complexity)
        }));

        try {
            const { error } = await supabase
                .from('tasks')
                .update({
                    status: newStatus,
                    completed_at: completedAt
                })
                .eq('id', taskId);

            if (error) throw error;
        } catch (e) {
            console.error(e);
            // Revert would be complex here, assuming success for prototype speed
        }
    },

    deleteTask: async (taskId) => {
        set(s => ({ tasks: s.tasks.filter(t => t.id !== taskId) }));
        await supabase.from('tasks').delete().eq('id', taskId);
    },

    createSprint: async (taskIds, rewardId) => {
        try {
            // 1. Create Sprint
            const { data, error } = await supabase
                .from('sprints')
                .insert({
                    state: 'active',
                    task_ids: taskIds,
                    reward_id: rewardId || null
                })
                .select()
                .single();

            if (error) throw error;

            const newSprint: Sprint = {
                id: data.id,
                state: 'active',
                taskIds: data.task_ids,
                rewardId: data.reward_id,
                startTime: new Date(data.start_time).getTime()
            };

            // 2. Update Tasks to link to Sprint (Optional, but good for query)
            await supabase
                .from('tasks')
                .update({ sprint_id: newSprint.id })
                .in('id', taskIds);

            set((state) => ({
                currentSprint: newSprint,
                tasks: state.tasks.map(t => taskIds.includes(t.id) ? { ...t, sprintId: newSprint.id } : t)
            }));
        } catch (e) {
            console.error(e);
        }
    },

    completeSprint: async () => {
        const { currentSprint } = get();
        if (!currentSprint) return;

        set({ currentSprint: { ...currentSprint, state: 'completed' } }); // Optimistic

        try {
            await supabase
                .from('sprints')
                .update({ state: 'completed', end_time: new Date().toISOString() })
                .eq('id', currentSprint.id);
        } catch (e) {
            console.error(e);
        }
    },

    addReward: async (reward) => {
        // Optimistic UI not needed as much here, but we'll do standard flow
        try {
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

            set(s => ({
                rewards: [...s.rewards, {
                    id: data.id,
                    title: data.title,
                    cost: data.cost,
                    tier: data.tier,
                    isRedeemed: false,
                    isLocked: true // Default
                }]
            }));
        } catch (e) {
            console.error(e);
        }
    },

    redeemReward: async (rewardId) => {
        const { score, rewards } = get();
        const reward = rewards.find(r => r.id === rewardId);
        if (!reward || score < reward.cost) return;

        set(s => ({
            score: s.score - reward.cost,
            rewards: s.rewards.map(r => r.id === rewardId ? { ...r, isRedeemed: true } : r)
        }));

        try {
            await supabase
                .from('rewards')
                .update({ is_redeemed: true })
                .eq('id', rewardId);
        } catch (e) {
            console.error(e);
        }
    },

    rerollTask: async (oldTaskId) => {
        const { tasks, currentSprint } = get();
        if (!currentSprint) return;

        // 1. Find a candidate from backlog (pending, not in sprint)
        const candidate = tasks.find(t =>
            t.status === 'pending' &&
            t.sprintId !== currentSprint.id &&
            t.id !== oldTaskId
        );

        if (!candidate) {
            console.log('No replacement task available');
            return;
        }

        // 2. Optimistic Swap
        const newTaskIds = currentSprint.taskIds.map(id => id === oldTaskId ? candidate.id : id);

        set(state => {
            const updatedSprint = { ...state.currentSprint!, taskIds: newTaskIds };

            // Unlink old task, link new task
            const updatedTasks = state.tasks.map(t => {
                if (t.id === oldTaskId) return { ...t, sprintId: undefined };
                if (t.id === candidate.id) return { ...t, sprintId: updatedSprint.id };
                return t;
            });

            return { currentSprint: updatedSprint, tasks: updatedTasks };
        });

        // 3. Persist
        try {
            await supabase
                .from('sprints')
                .update({ task_ids: newTaskIds })
                .eq('id', currentSprint.id);

            await supabase.from('tasks').update({ sprint_id: null }).eq('id', oldTaskId);
            await supabase.from('tasks').update({ sprint_id: currentSprint.id }).eq('id', candidate.id);
        } catch (e) {
            console.error(e);
        }
    }
}));
