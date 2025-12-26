# 🔍 Focus Timeline - Debugging Guide

## Issue 1: Only Seeing 3 Tasks

### **What's Happening:**
The timeline code is correct and SHOULD show all tasks. The logic is:

```typescript
sprintTasks.forEach((task, index) => {
    items.push({ type: 'task', data: task, groupIndex });
    
    // After every 3 tasks, add reward
    if ((index + 1) % 3 === 0 && sprintReward) {
        items.push({ type: 'reward', data: sprintReward, groupIndex });
    }
});
```

This loops through ALL `sprintTasks`, so if you have 6, 9, 12+ tasks, they should all appear.

### **Possible Causes:**

1. **Sprint Only Has 3 Task IDs**
   ```
   Check console for:
   "📋 Sprint Tasks: X out of Y"
   ```
   - If it says "3 out of 3" → Sprint only has 3 tasks
   - If it says "0 out of 6" → Task IDs don't match (mismatch bug)

2. **Sprint Wasn't Deployed With All Tasks**
   - When AI deploys sprint, it might only select 3 tasks
   - Check: `currentSprint.taskIds.length`

3. **Render Loop Issue**
   - Timeline items are created but not rendering
   - Check console for timeline items count

---

## Issue 2: Can't Click AI Response

### **Current State:**
The ChatWidgetFactory DOES have clickable cards:

```tsx
case 'TASK_CREATED':
    return (
        <InteractiveTaskCard taskId={metadata.taskId} />
    );

case 'REWARD_EARNED':
    return (
        <RewardUnlockCard rewardId={metadata.rewardId} />
    );
```

### **Why It Might Not Work:**

1. **Missing taskId/rewardId in metadata**
   ```typescript
   // Check if this exists:
   action.metadata?.taskId  // For tasks
   action.metadata?.rewardId // For rewards
   ```

2. **InteractiveTaskCard Not Implemented**
   - Component might not exist or be incomplete
   - Check: `src/components/features/chat/InteractiveTaskCard.tsx`

3. **Action Processing Doesn't Set IDs**
   ```typescript
   // In ChatScreen.tsx, after creating task:
   addTask(...).then((newTask) => {
       // Need to add to action log WITH taskId
       setMessages(prev => [...prev, {
           ...action,
           metadata: { ...action.metadata, taskId: newTask.id }
       }]);
   });
   ```

---

## 🔧 Quick Fixes

### **Fix 1: Verify Sprint Has All Tasks**

Add this to FocusScreen:

```tsx
useEffect(() => {
    if (currentSprint) {
        console.log('🔍 Current Sprint:', {
            id: currentSprint.id,
            taskIds: currentSprint.taskIds,
            taskCount: currentSprint.taskIds.length
        });
        console.log('🔍 Sprint Tasks Found:', sprintTasks.length);
        console.log('🔍 Timeline Items:', timeline.length);
    }
}, [currentSprint, sprintTasks, timeline]);
```

**Expected Output:**
```
🔍 Current Sprint: {
    id: "sprint-uuid",
    taskIds: ["id1", "id2", "id3", "id4", "id5", "id6"],
    taskCount: 6
}
🔍 Sprint Tasks Found: 6
🔍 Timeline Items: 8  // 6 tasks + 2 rewards
```

If `taskCount` is 3 but you expect more:
→ Sprint was only deployed with 3 tasks
→ Need to deploy new sprint with more tasks

---

### **Fix 2: Make Task Cards Clickable**

Create `InteractiveTaskCard.tsx`:

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTaskStore } from '../../../store/useTaskStore';
import * as Haptics from 'expo-haptics';

export const Interact iveTaskCard = ({ taskId }: { taskId: string }) => {
    const task = useTaskStore(state => state.tasks.find(t => t.id === taskId));
    const toggleTaskStatus = useTaskStore(state => state.toggleTaskStatus);

    if (!task) return null;

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toggleTaskStatus(taskId);
    };

    return (
        <TouchableOpacity 
            style={styles.card}
            onPress={handlePress}
            activeOpacity={0.8}
        >
            <Text style={styles.title}>{task.title}</Text>
            <View style={styles.footer}>
                <Text style={styles.tag}>{task.contextTag}</Text>
                <Text style={styles.complexity}>⚡ {task.complexity}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 14,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: '#212121',
        marginBottom: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tag: {
        fontSize: 12,
        color: '#757575',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    complexity: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2196F3',
    },
});
```

---

### **Fix 3: Update Action Processing**

In `ChatScreen.tsx`, update `processActionSideEffects`:

```typescript
if (action.type === 'TASK_CREATED' && action.metadata?.widgetData) {
    const taskData = action.metadata.widgetData;
    
    addTask(taskData.title, taskData.complexity, contextTag).then(() => {
        const newTask = tasks[tasks.length - 1]; // Get newly added task
        
        // Update action with taskId
        setMessages(prev => prev.map(msg => 
            msg.id === action.id
                ? { ...msg, metadata: { ...msg.metadata, taskId: newTask.id } }
                : msg
        ));
        
        fetchInitialData();
    });
}
```

---

## 🧪 Testing Steps

1. **Check Sprint Task Count:**
   ```
   Open app → Focus tab
   Check console for "Sprint Tasks: X out of Y"
   ```

2. **Deploy New Sprint:**
   ```
   Go to Assistant
   Say: "Deploy a sprint with 9 tasks"
   Wait for completion
   Go to Focus tab
   Should see 3 groups of 3 tasks
   ```

3. **Test Task Cards:**
   ```
   Go to Assistant
   Say: "Create a task to test emails"
   → Card should appear below AI message
   → Click card → Should toggle completion
   ```

---

## 📊 Expected Behavior

### **6 Tasks:**
```
Task 1 ⚪
Task 2 ⚪
Task 3 ⚪
Reward 🔒

Task 4 ⚪
Task 5 ⚪
Task 6  ⚪
Reward 🔒
```

### **9 Tasks:**
```
Task 1-3 + Reward
Task 4-6 + Reward
Task 7-9 + Reward
```

### **AI Response:**
```
[AI Message: "Created task"]
┌─────────────────────┐
│  Test Emails        │  ← Clickable Card
│  Work        ⚡ 2   │
└─────────────────────┘
```

---

## ✅ Summary

- ✅ Timeline code loops through ALL sprint tasks
- ✅ Groups every 3 tasks + 1 reward
- ❓ Check if sprint actually has all tasks
- ❓ Create InteractiveTaskCard component
- ❓ Update action processing to include IDs

Check the console logs to see actual task counts!
