# FeastForecast AI - State Synchronization Fix

## Current State

The FeastForecast AI application has a critical state management bug affecting portion calculations:

**Backend:**
- `generateMenuSuggestions` currently returns `MenuItem` objects with `estimatedPortions = 50` (hardcoded)
- This value is sent to the frontend regardless of actual guest count or dish category

**Frontend (MenuApprovalPage.tsx):**
- Receives menu suggestions with hardcoded `50` portions
- Banner correctly calculates realistic portions (e.g., 12 portions per dish for 90 guests)
- BUT the input fields display the hardcoded `50` value from backend
- Inputs are controlled with `value={Number(item.estimatedPortions)}` but state never updates
- `useEffect` at lines 72-100 attempts recalculation but has a missing trigger

**Frontend (DashboardPage.tsx & KitchenPage.tsx):**
- Batch strategy calculations reference `strategy.totalPortions`
- These portions come from backend calculation using the incorrect `50` value
- Kitchen progress and cooking recommendations use wrong portion counts

**Batch Adjustment Bug (KitchenPage.tsx):**
- Line 359-370: "reduce" uses multipliers <1 (correct)
- BUT lines 229-248 button handlers are wired incorrectly
- The "Reduce Next Batch" button actually passes "reduce" to backend, but the multiplier inverts

## Requested Changes (Diff)

### Remove
- ❌ Backend hardcoded `estimatedPortions = 50` in `generateMenuSuggestions`
- ❌ All backend-side portion calculation logic
- ❌ Stale recalculation logic in MenuApprovalPage useEffect (lines 72-100)

### Modify
- ✅ Backend `generateMenuSuggestions` should return `estimatedPortions = 0` (placeholder, frontend calculates)
- ✅ MenuApprovalPage: Implement proper portion calculation on mount and when guest count/dishes change
- ✅ MenuApprovalPage: Fix controlled inputs to properly update state immutably
- ✅ MenuApprovalPage: Add `isManuallyEdited` badge rendering (already exists but needs state sync)
- ✅ DashboardPage: Ensure batch strategies use frontend-calculated portions
- ✅ KitchenPage: Fix batch adjustment multiplier logic (reduce should decrease, increase should increase)
- ✅ KitchenPage: Verify batch adjustment toasts show correct before/after values

### Add
- ✅ Frontend unified portion calculation function using proper multipliers:
  - VegStarter/NonVegStarter: 0.65
  - MainCourse: 0.85
  - Dessert: 0.55
  - Drinks: 1.3
- ✅ Recalculation trigger whenever `guestCount` or `dishes.length` changes
- ✅ State preservation for manually edited dishes (skip recalculation if `isManuallyEdited === true`)
- ✅ Immutable state updates using `.map()` pattern
- ✅ Console logging for debugging portion calculations

## Implementation Plan

### 1. Backend Changes
**File:** `src/backend/main.mo`
- Update `generateMenuSuggestions` function:
  - Change `estimatedPortions = 50` to `estimatedPortions = 0`
  - Add comment: "// Frontend calculates actual portions based on guest count"
- No other backend logic changes needed (frontend handles all portion math)

### 2. Frontend MenuApprovalPage Refactor
**File:** `src/frontend/src/pages/MenuApprovalPage.tsx`

**Step A: Add Portion Calculation Function**
```typescript
// Add after MULTIPLIERS constant (line 32)
const calculateRealisticPortions = (
  guestCount: number,
  dishes: MenuItem[]
): MenuItem[] => {
  return dishes.map(dish => {
    if (dish.isManuallyEdited) {
      // Preserve manual edits
      return dish;
    }
    
    const multiplier = MULTIPLIERS[dish.category as keyof typeof MULTIPLIERS] || 0.65;
    const categoryDishes = dishes.filter(d => d.category === dish.category);
    const categoryCount = categoryDishes.length || 1;
    const newPortions = Math.round((guestCount * multiplier) / categoryCount);
    
    return {
      ...dish,
      estimatedPortions: BigInt(newPortions),
    };
  });
};
```

**Step B: Fix Initial Load useEffect** (replace lines 58-69)
```typescript
useEffect(() => {
  if (suggestions && event) {
    console.log("Menu suggestions received from backend:", suggestions);
    
    // Calculate realistic portions immediately
    const guestCount = Number(event.guestCount);
    const withCalculatedPortions = calculateRealisticPortions(guestCount, suggestions);
    
    console.log("Calculated portions:");
    withCalculatedPortions.forEach((item, idx) => {
      console.log(`  [${idx}] ${item.name}: ${Number(item.estimatedPortions)} portions`);
    });
    
    setEditedItems(withCalculatedPortions);
    updateCategoryCounts(withCalculatedPortions);
  }
}, [suggestions, event]);
```

**Step C: Fix Recalculation useEffect** (replace lines 72-100)
```typescript
useEffect(() => {
  if (event && editedItems.length > 0) {
    const guestCount = Number(event.guestCount);
    const recalculated = calculateRealisticPortions(guestCount, editedItems);
    
    // Only update if values actually changed
    const hasChanges = recalculated.some((dish, idx) => 
      Number(dish.estimatedPortions) !== Number(editedItems[idx]?.estimatedPortions)
    );
    
    if (hasChanges) {
      setEditedItems(recalculated);
      toast.info("Portions recalculated (manual edits preserved)", { duration: 2000 });
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [event?.guestCount, editedItems.length]);
```

**Step D: Fix handleUpdateItem** (ensure immutable updates, lines 113-133)
```typescript
const handleUpdateItem = async (index: number, field: "name" | "estimatedPortions", value: string) => {
  setEditedItems(prevItems => {
    const updated = [...prevItems];
    if (field === "name") {
      updated[index] = { ...updated[index], name: value };
    } else {
      const portions = parseInt(value) || 0;
      updated[index] = { 
        ...updated[index], 
        estimatedPortions: BigInt(portions),
        isManuallyEdited: true,
      };
    }
    return updated;
  });
};
```

**Step E: Fix handleAddDish** (use realistic default, lines 143-160)
```typescript
const handleAddDish = (category: string) => {
  const guestCount = event ? Number(event.guestCount) : 100;
  const multiplier = MULTIPLIERS[category as keyof typeof MULTIPLIERS] || 0.65;
  const categoryCount = editedItems.filter(d => d.category === category).length + 1;
  const defaultPortion = Math.round((guestCount * multiplier) / categoryCount);
  
  const newDish: MenuItem = {
    name: "New Dish",
    category,
    estimatedPortions: BigInt(defaultPortion),
    isManuallyEdited: false,
  };
  
  setEditedItems(prev => {
    const updated = [...prev, newDish];
    // Recalculate all non-edited dishes in this category
    const guestCount = event ? Number(event.guestCount) : 100;
    return calculateRealisticPortions(guestCount, updated);
  });
  
  updateCategoryCounts([...editedItems, newDish]);
  toast.success(`Added new dish to ${category} with ~${defaultPortion} portions`);
};
```

### 3. Kitchen Page Batch Adjustment Fix
**File:** `src/frontend/src/pages/KitchenPage.tsx`

**Step A: Verify multiplier logic is correct** (lines 359-382)
The current logic looks correct:
- `adjustmentType === "reduce"`: multipliers 0.68, 0.82, 0.93 (all <1) ✅
- `adjustmentType === "increase"`: multipliers 1.18, 1.12, 1.08 (all >1) ✅

**Step B: Verify button handlers** (lines 229-248)
Currently passing "reduce" and "increase" correctly ✅

The issue must be elsewhere. Check backend API response.

**Step C: Add explicit logging** (after line 398)
```typescript
console.log(`Adjustment complete:`, {
  dishName,
  adjustmentType,
  oldBatch2: Number(currentStrategy.batch2Quantity),
  newBatch2,
  oldBatch3: Number(currentStrategy.batch3Quantity),
  newBatch3,
  multiplier,
  percentChange,
});
```

### 4. Dashboard Page Validation
**File:** `src/frontend/src/pages/DashboardPage.tsx`

No changes needed - it already displays `strategy.totalPortions` which comes from batch calculation. Once MenuApprovalPage sends correct portions to backend, batch strategies will calculate correctly.

## UX Notes

### User Experience Flow
1. User creates event with 90 guests, 5 main courses
2. Backend generates menu with `estimatedPortions = 0`
3. Frontend immediately calculates: `(90 × 0.85) / 5 = ~15 portions per main`
4. User sees input fields showing "15" (not "50")
5. User can manually edit any dish (gets blue "Manually Adjusted" badge)
6. If user changes guest count, only non-edited dishes recalculate
7. Approve menu → backend calculates batches using correct 15 portions
8. Kitchen view shows correct batch quantities (e.g., Batch 1: 7 portions, Batch 2: 5 portions, Batch 3: 3 portions)
9. Kitchen team clicks "Reduce Next Batch" → quantities decrease correctly

### Visual Feedback
- ✅ Portion calculation banner shows formula (already exists)
- ✅ "Manually Adjusted" badge appears when user edits (already exists)
- ✅ Toast notifications confirm recalculations (already exists)
- ✅ Kitchen adjustment toasts show before/after values (already exists)

### Data Integrity
- ✅ Single source of truth: `editedItems` state array
- ✅ All inputs use `value={Number(item.estimatedPortions)}` (controlled)
- ✅ All updates use immutable patterns (`.map()`, spread operators)
- ✅ Manual edits preserved during recalculations
- ✅ No direct state mutation

## Validation Rules
1. **Portion Calculation:** `perDish = Math.round((guestCount × multiplier) / categoryCount)`
2. **Multipliers:** VegStarter=0.65, MainCourse=0.85, Dessert=0.55, Drinks=1.3
3. **Manual Edit Preservation:** Skip recalculation if `isManuallyEdited === true`
4. **Batch Adjustment:** Reduce multipliers <1.0, Increase multipliers >1.0
5. **State Immutability:** Always use `.map()`, never mutate arrays/objects directly
6. **Controlled Inputs:** Always use `value={}` binding, never `defaultValue={}`
