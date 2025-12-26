# 🎨 Focus Screen - New Timeline UX

## ✅ Complete Redesign

### **New Features:**

1. **Minimalistic Timeline Layout**
   - Vertical timeline with connecting lines
   - Clean dots for each item
   - No time stamps (removed 9:00 AM, etc.)

2. **Task Cards**
   - ↻ Regen button (top-right)
   - Task title
   - Context tags
   - **Clickable weight pills (1, 2, 3)**
     - Blue when active (≤ complexity)
     - Changes to darker blue when selected
     - Click to toggle selection

3. **3 Tasks → 1 Reward Pattern**
   ```
   Task 1
   Task 2  
   Task 3
   Reward (unlocked if all 3 done)
   
   Task 4
   Task 5
   Task 6
   Reward (locked until done)
   ```

4. **Smart Reward States**
   - **Locked**: Grey card with "🔒 Complete 3 tasks"
   - **Unlocked**: Green card with "CLAIM" button
   - Shows tier badge (BRONZE/SILVER/GOLD)
   - Shows energy cost (⚡ 3)

---

## 🎯 User Interactions

### **Task Interactions:**

1. **Toggle Completion**
   - Click the timeline dot
   - Dot turns green with ✓
   - Card becomes semi-transparent
   - Task title gets strikethrough

2. **Change Weight Selection**
   - Click any of the 3 weight pills
   - Pill changes to solid blue
   - Haptic feedback on click
   - Click again to deselect

3. **Regenerate Task**
   - Click ↻ button (only visible when not completed)
   - Triggers `rerollTask()`
   - Gets new task from AI

### **Reward Interactions:**

1. **Claim Reward**
   - Only when all 3 tasks in group are done
   - Card turns green
   - Shows "CLAIM" button
   - Click to claim (triggers haptic success)

2. **Locked State**
   - Shows progress hint
   - Cannot interact
   - Grey/muted colors

---

## 📊 Timeline Logic

###  **Auto-Grouping:**

```typescript
// Example with 6 tasks:
Group 0: [Task 0, Task 1, Task 2] → Reward
Group 1: [Task 3, Task 4, Task 5] → Reward

// With 9 tasks:
Group 0: [Task 0, Task 1, Task 2] → Reward
Group 1: [Task 3, Task 4, Task 5] → Reward
Group 2: [Task 6, Task 7, Task 8] → Reward
```

### **Completion Check:**

```typescript
isGroupCompleted(groupIndex) {
    const groupTasks = tasks.slice(groupIndex * 3, (groupIndex + 1) * 3);
    return groupTasks.every(t => t.status === 'completed');
}
```

When all 3 tasks in a group are ✓:
- Reward card unlocks
- Can claim reward
- Card turns green

---

## 🎨 Visual Design

### **Colors:**

- **Background**: `#F8F9FA` - Light grey
- **Cards**: `#FFFFFF` - White
- **Primary**: `#2196F3` - Blue (weight pills)
- **Success**: `#4CAF50` - Green (completed, claim)
- **Reward**: `#FFB300` - Gold (reward timeline)
- **Locked**: `#FFF3E0` - Light orange (locked reward)
- **Unlocked**: `#E8F5E9` - Light green (claimable reward)

### **Weight Pills:**

```
Inactive:  ⚪ Grey background, grey text
Active:    🔵 Blue background, blue text
Selected:  🔵 Solid blue, white text
```

### **Timeline Dots:**

```
Task Pending:   ⚪ White with grey border
Task Completed: 🟢 Green with ✓
Reward:         🎁 White with gold border
```

---

## 🔄 AI Integration

### **When AI Creates Task:**

```typescript
// In ChatScreen, when AI responds with task:
{
    type: 'TASK_CREATED',
    metadata: {
        widgetData: {
            title: "Review code",
            complexity: 2,
            tags: ["Work"]
        }
    }
}
```

→ Task card appears in timeline
→ Animation: FadeInDown
→ Positioned after existing tasks

### **When AI Creates Reward:**

```typescript
{
    type: 'REWARD_EARNED',
    metadata: {
        widgetData: {
            title: "Coffee break",
            cost: 3,
            tier: "bronze"
        }
    }
}
```

→ Reward card appears after every 3rd task
→ Initially locked
→ Unlocks when 3 tasks completed

---

## 📱 Component Structure

```
FocusScreen
├── Header
│   ├── Title: "Today's Focus"
│   └── Subtitle: "X tasks in timeline"
│
└── Timeline (ScrollView)
    ├── TimelineTask (x3)
    │   ├── Connector (vertical line)
    │   ├── Dot (clickable)
    │   └── Card
    │       ├── Regen Button
    │       ├── Task Content
    │       │   ├── Title
    │       │   └── Tags
    │       └── Weight Pills (1, 2, 3)
    │
    ├── TimelineReward
    │   ├── Connector
    │   ├── Dot (🎁)
    │   └── Card
    │       ├── Title
    │       ├── Meta (tier, cost)
    │       └── Claim/Locked Button
    │
    └── (Repeat for more groups...)
```

---

## ✨ Animations

1. **Enter Animation**
   - Each card: `FadeInDown.delay(index * 50)`
   - Staggered appearance
   - Smooth 50ms delay between items

2. **Haptic Feedback**
   - Weight pill click: Light impact
   - Regen click: Medium impact
   - Task complete: Medium impact
   - Claim reward: Success notification

3. **State Transitions**
   - Smooth opacity change on completion
   - Border color changes
   - Background color fades

---

## 🎯 Key Improvements

**Before:**
- ❌ Time stamps (9:00 AM) were confusing
- ❌ All tasks in one long list
- ❌ Reward hidden/unclear
- ❌ No weight interaction
- ❌ No clear grouping

**After:**
- ✅ Clean timeline without times
- ✅ Clear 3-task groups
- ✅ Reward shows after each group
- ✅ Interactive weight selection
- ✅ Visual progress through groups
- ✅ Satisfying completion flow

---

## 🚀 Usage

**Deploy a sprint:**
```
"Hey, deploy a sprint with 6 tasks"
```

**Result:**
```
Task 1  ← Group 0
Task 2
Task 3
Reward 🔒

Task 4  ← Group 1
Task 5
Task 6
Reward 🔒
```

**Complete 3 tasks:**
```
✓ Task 1
✓ Task 2
✓ Task 3
Reward 🎁 CLAIM → Unlocked!
```

---

## 📝 Next Steps

1. **Implement Claim Logic**
   ```typescript
   const handleClaim = async () => {
       await redeemReward(reward.id);
       await completeSprint();
       // Show success animation
   };
   ```

2. **Weight Update**
   - Connect weight selection to task update
   - Persist selected weight
   - Show in AI context

3. **Animations**
   - Add confetti on reward claim
   - Pulse effect on unlocked reward
   - Smooth card exits

---

**The new Focus screen is now live with a beautiful timeline UX!** ✨🎯
