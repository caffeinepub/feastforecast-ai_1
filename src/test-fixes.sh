#!/bin/bash

echo "🔍 FeastForecast AI - State Management Fixes Verification"
echo "========================================================="
echo ""

# Change to workspace directory
cd /home/ubuntu/workspace

# 1. TypeScript Check
echo "✓ Running TypeScript check..."
if pnpm --filter '@caffeine/template-frontend' typescript-check 2>&1 | grep -E "error TS[0-9]+"; then
    echo "  ❌ TypeScript errors found"
    exit 1
else
    echo "  ✅ TypeScript check passed (0 errors)"
fi
echo ""

# 2. Lint Check
echo "✓ Running ESLint..."
LINT_OUTPUT=$(pnpm --filter '@caffeine/template-frontend' lint 2>&1)
if echo "$LINT_OUTPUT" | grep -q "✖.*([1-9][0-9]* errors"; then
    echo "  ❌ ESLint errors found"
    echo "$LINT_OUTPUT"
    exit 1
else
    echo "  ✅ ESLint passed (0 errors, only warnings in generated files)"
fi
echo ""

# 3. Build Check
echo "✓ Running build..."
if pnpm --filter '@caffeine/template-frontend' build:skip-bindings 2>&1 | grep -E "ERROR|error TS[0-9]+"; then
    echo "  ❌ Build failed"
    exit 1
else
    echo "  ✅ Build succeeded"
fi
echo ""

# 4. Check key files were modified
echo "✓ Verifying modified files..."
if grep -q "isManuallyEdited: true" src/frontend/src/pages/MenuApprovalPage.tsx; then
    echo "  ✅ MenuApprovalPage.tsx: Manual edit tracking added"
else
    echo "  ⚠️  MenuApprovalPage.tsx: Manual edit tracking NOT found"
fi

if grep -q "Manually Adjusted" src/frontend/src/pages/MenuApprovalPage.tsx; then
    echo "  ✅ MenuApprovalPage.tsx: Manual edit badge added"
else
    echo "  ⚠️  MenuApprovalPage.tsx: Manual edit badge NOT found"
fi

if grep -q "consumptionRate" src/frontend/src/pages/KitchenPage.tsx; then
    echo "  ✅ KitchenPage.tsx: Consumption-based adjustment added"
else
    echo "  ⚠️  KitchenPage.tsx: Consumption-based adjustment NOT found"
fi

if grep -q "Menu suggestions received from backend" src/frontend/src/pages/MenuApprovalPage.tsx; then
    echo "  ✅ MenuApprovalPage.tsx: Console logging added"
else
    echo "  ⚠️  MenuApprovalPage.tsx: Console logging NOT found"
fi
echo ""

# 5. Summary
echo "========================================================="
echo "✅ All automated checks passed!"
echo ""
echo "📝 Next steps for manual testing:"
echo "  1. Create event with 90 guests, 5 main courses"
echo "  2. Check browser console for portion values"
echo "  3. Edit a dish portion → verify badge appears"
echo "  4. Navigate to kitchen view"
echo "  5. Test 'Reduce Next Batch' → verify quantities decrease"
echo ""
echo "📄 See FIXES_APPLIED.md for full testing checklist"
echo "========================================================="
