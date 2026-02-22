import { useState } from "react";
import { useParams, useRouter } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  ChefHat,
  Bell,
  AlertCircle,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
} from "lucide-react";
import { useGetEventDashboard, useAdjustBatchQuantities } from "@/hooks/useQueries";
import { RiskLevel, EventStatus } from "@/backend";
import type { BatchStrategy } from "@/backend";

interface KitchenDishCardProps {
  strategy: BatchStrategy;
  eventId: string;
  onBatchToggle: (dishName: string, batchNumber: 1 | 2 | 3, checked: boolean) => void;
  onAdjustBatch: (dishName: string, adjustmentType: "reduce" | "increase") => void;
  batch1Complete: boolean;
  batch2Started: boolean;
  batch2Complete: boolean;
  batch3Started: boolean;
}

function KitchenDishCard({ 
  strategy, 
  eventId,
  onBatchToggle,
  onAdjustBatch,
  batch1Complete,
  batch2Started,
  batch2Complete,
  batch3Started,
}: KitchenDishCardProps) {
  const consumptionPercent = batch1Complete ? (batch2Complete ? 85 : 60) : 30;

  const getSuggestion = () => {
    if (!batch1Complete) {
      return "Complete Batch 1 first";
    }
    if (consumptionPercent >= 70 && !batch2Started) {
      return "⚡ Start Batch 2 now!";
    }
    if (consumptionPercent < 50 && batch1Complete && !batch2Started) {
      return "⏸️ Wait 15 minutes before starting Batch 2";
    }
    if (batch2Complete && strategy.batch3Quantity > 0n) {
      return consumptionPercent >= 85 ? "Start Batch 3 if needed" : "Hold Batch 3 - monitor consumption";
    }
    if (batch2Started && !batch2Complete) {
      return "Batch 2 in progress";
    }
    return "Monitor consumption and adjust as needed";
  };

  const getRiskColorClass = (risk: RiskLevel) => {
    switch (risk) {
      case RiskLevel.high:
        return "border-red-500 bg-red-50/50";
      case RiskLevel.medium:
        return "border-orange-500 bg-orange-50/50";
      case RiskLevel.low:
        return "border-green-500 bg-green-50/50";
      default:
        return "border-gray-300 bg-white";
    }
  };

  const suggestion = getSuggestion();
  const isUrgent = suggestion.includes("⚡");
  const shouldWait = suggestion.includes("⏸️");
  const riskColorClass = getRiskColorClass(strategy.riskLevel);

  return (
    <Card className={`shadow-md border-l-4 ${riskColorClass} hover:shadow-lg transition-all`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg mb-1">{strategy.dishName}</CardTitle>
            <p className="text-xs text-muted-foreground">{strategy.dishCategory}</p>
          </div>
          <Badge
            variant={
              strategy.riskLevel === RiskLevel.high
                ? "destructive"
                : strategy.riskLevel === RiskLevel.medium
                ? "default"
                : "secondary"
            }
            className="text-xs"
          >
            RISK: {Number(strategy.riskScore)}/100
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3 p-3 bg-background rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <Checkbox
              id={`batch1-${strategy.dishName}`}
              checked={batch1Complete}
              onCheckedChange={(checked) => {
                onBatchToggle(strategy.dishName, 1, checked as boolean);
              }}
              className="data-[state=checked]:bg-blue-600"
            />
            <label
              htmlFor={`batch1-${strategy.dishName}`}
              className={`text-sm font-medium cursor-pointer flex-1 ${
                batch1Complete ? "line-through text-muted-foreground" : "text-foreground"
              }`}
            >
              Batch 1 Complete ({Number(strategy.batch1Quantity)} portions)
            </label>
            {batch1Complete && <CheckCircle2 className="w-4 h-4 text-blue-600 animate-scale-in" />}
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id={`batch2-${strategy.dishName}`}
              checked={batch2Started}
              onCheckedChange={(checked) => {
                onBatchToggle(strategy.dishName, 2, checked as boolean);
              }}
              disabled={!batch1Complete}
              className="data-[state=checked]:bg-orange-600"
            />
            <label
              htmlFor={`batch2-${strategy.dishName}`}
              className={`text-sm font-medium cursor-pointer flex-1 ${
                !batch1Complete
                  ? "text-muted-foreground/50"
                  : "text-foreground"
              }`}
            >
              Batch 2 Started ({Number(strategy.batch2Quantity)} portions)
            </label>
            {batch2Started && <CheckCircle2 className="w-4 h-4 text-orange-600 animate-scale-in" />}
          </div>

          {strategy.batch3Quantity > 0n && (
            <div className="flex items-center gap-3">
              <Checkbox
                id={`batch3-${strategy.dishName}`}
                checked={batch3Started}
                onCheckedChange={(checked) => {
                  onBatchToggle(strategy.dishName, 3, checked as boolean);
                }}
                disabled={!batch2Complete}
                className="data-[state=checked]:bg-green-600"
              />
              <label
                htmlFor={`batch3-${strategy.dishName}`}
                className={`text-sm font-medium cursor-pointer flex-1 ${
                  !batch2Complete
                    ? "text-muted-foreground/50"
                    : "text-foreground"
                }`}
              >
                Batch 3 Started ({Number(strategy.batch3Quantity)} portions)
              </label>
              {batch3Started && <CheckCircle2 className="w-4 h-4 text-green-600 animate-scale-in" />}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Estimated Consumption</span>
            <span className="font-semibold text-foreground">{consumptionPercent}%</span>
          </div>
          <Progress value={consumptionPercent} className="h-2" />
        </div>

        <div
          className={`p-3 rounded-lg border flex items-start gap-3 transition-all ${
            isUrgent
              ? "bg-red-50 border-red-200 animate-pulse-slow"
              : shouldWait
              ? "bg-yellow-50 border-yellow-200"
              : consumptionPercent >= 70
              ? "bg-green-50 border-green-200"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <Clock
            className={`w-5 h-5 mt-0.5 shrink-0 ${
              isUrgent
                ? "text-red-600"
                : shouldWait
                ? "text-yellow-600"
                : consumptionPercent >= 70
                ? "text-green-600"
                : "text-blue-600"
            }`}
          />
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-foreground">
              Next Action
            </p>
            <p
              className={`text-sm font-medium ${
                isUrgent
                  ? "text-red-900"
                  : shouldWait
                  ? "text-yellow-900"
                  : consumptionPercent >= 70
                  ? "text-green-900"
                  : "text-blue-900"
              }`}
            >
              {suggestion}
            </p>
          </div>
        </div>

        {batch1Complete && !batch2Complete && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2 text-xs hover:scale-105 transition-transform"
              onClick={() => onAdjustBatch(strategy.dishName, "reduce")}
            >
              <TrendingDown className="w-3 h-3" />
              Reduce Next Batch
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2 text-xs hover:scale-105 transition-transform"
              onClick={() => onAdjustBatch(strategy.dishName, "increase")}
            >
              <TrendingUp className="w-3 h-3" />
              Increase Next Batch
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
          <Clock className="w-3 h-3 inline mr-1" />
          {strategy.cookingTimingSuggestion}
        </div>
      </CardContent>
    </Card>
  );
}

export function KitchenPage() {
  const { eventId } = useParams({ strict: false });
  const router = useRouter();
  const eventIdBigInt = eventId ? BigInt(eventId) : null;

  const { data: event, isLoading } = useGetEventDashboard(eventIdBigInt);
  const adjustBatchQuantities = useAdjustBatchQuantities();
  
  // Local state to track batch progress
  const [localProgress, setLocalProgress] = useState<Record<string, {
    batch1Complete: boolean;
    batch2Started: boolean;
    batch2Complete: boolean;
    batch3Started: boolean;
  }>>({});

  // Local state to track adjusted batch strategies
  const [adjustedStrategies, setAdjustedStrategies] = useState<Record<string, BatchStrategy>>({});

  const handleBatchToggle = (dishName: string, batchNumber: 1 | 2 | 3, checked: boolean) => {
    const currentProgress = localProgress[dishName] || {
      batch1Complete: false,
      batch2Started: false,
      batch2Complete: false,
      batch3Started: false,
    };

    const updated = { ...currentProgress };
    
    if (batchNumber === 1) {
      updated.batch1Complete = checked;
      if (checked) {
        toast.success(`✓ Batch 1 complete for ${dishName}`, {
          icon: <CheckCircle2 className="w-4 h-4 text-blue-600" />,
        });
      }
    } else if (batchNumber === 2) {
      updated.batch2Started = checked;
      if (checked) {
        updated.batch2Complete = true;
        toast.success(`✓ Batch 2 started for ${dishName}`, {
          icon: <CheckCircle2 className="w-4 h-4 text-orange-600" />,
        });
      } else {
        updated.batch2Complete = false;
      }
    } else if (batchNumber === 3) {
      updated.batch3Started = checked;
      if (checked) {
        toast.success(`✓ Batch 3 started for ${dishName}`, {
          icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
        });
      }
    }

    setLocalProgress({
      ...localProgress,
      [dishName]: updated,
    });
  };

  const handleAdjustBatch = async (dishName: string, adjustmentType: "reduce" | "increase") => {
    if (!eventIdBigInt) return;

    try {
      // Get current strategy
      const currentStrategy = adjustedStrategies[dishName] || 
        event?.batchStrategies.find(s => s.dishName === dishName);
      
      if (!currentStrategy) {
        toast.error("Could not find batch strategy for this dish");
        return;
      }

      // Calculate consumption rate from progress
      const progress = localProgress[dishName] || {
        batch1Complete: false,
        batch2Started: false,
        batch2Complete: false,
        batch3Started: false,
      };
      
      // Estimate consumption based on batch completion
      const batch1Qty = Number(currentStrategy.batch1Quantity);
      const consumedPortions = progress.batch1Complete ? 
        (progress.batch2Complete ? batch1Qty + Number(currentStrategy.batch2Quantity) * 0.7 : batch1Qty * 0.7) 
        : batch1Qty * 0.3;
      
      const consumptionRate = consumedPortions / batch1Qty;
      
      console.log(`Adjusting ${dishName}:`, {
        adjustmentType,
        consumptionRate,
        batch1Complete: progress.batch1Complete,
        batch2Complete: progress.batch2Complete,
      });
      
      // Calculate smart adjustment based on consumption rate
      let multiplier: number;
      if (adjustmentType === "reduce") {
        // Consumption-based reduction:
        // <50% consumed → aggressive reduction (25-35%)
        // 50-75% → moderate reduction (15-20%)
        // 75%+ → minimal reduction (5-10%)
        if (consumptionRate < 0.5) {
          multiplier = 0.68; // ~32% reduction
        } else if (consumptionRate < 0.75) {
          multiplier = 0.82; // ~18% reduction
        } else {
          multiplier = 0.93; // ~7% reduction
        }
      } else {
        // Consumption-based increase:
        // 75-90% → moderate increase (10-15%)
        // >90% → aggressive increase (15-20%)
        if (consumptionRate > 0.9) {
          multiplier = 1.18; // ~18% increase
        } else if (consumptionRate > 0.75) {
          multiplier = 1.12; // ~12% increase
        } else {
          multiplier = 1.08; // ~8% increase
        }
      }
      
      const newBatch2 = Math.round(Number(currentStrategy.batch2Quantity) * multiplier);
      const newBatch3 = Math.round(Number(currentStrategy.batch3Quantity) * multiplier);
      
      console.log(`=== Batch Adjustment Calculation ===`, {
        dishName,
        adjustmentType,
        multiplier,
        consumptionRate,
        oldBatch2: Number(currentStrategy.batch2Quantity),
        newBatch2,
        oldBatch3: Number(currentStrategy.batch3Quantity),
        newBatch3,
        expectedDirection: adjustmentType === "reduce" ? "decrease" : "increase",
        actualDirection: newBatch2 < Number(currentStrategy.batch2Quantity) ? "decrease" : "increase",
      });
      
      // Validate the adjustment is in the correct direction
      if (adjustmentType === "reduce" && newBatch2 >= Number(currentStrategy.batch2Quantity)) {
        console.error("❌ BUG: Reduce increased quantities!", {
          oldBatch2: Number(currentStrategy.batch2Quantity),
          newBatch2,
          multiplier,
        });
        toast.error("Adjustment error detected - please report this bug");
        return;
      }
      if (adjustmentType === "increase" && newBatch2 <= Number(currentStrategy.batch2Quantity)) {
        console.error("❌ BUG: Increase decreased quantities!", {
          oldBatch2: Number(currentStrategy.batch2Quantity),
          newBatch2,
          multiplier,
        });
        toast.error("Adjustment error detected - please report this bug");
        return;
      }
      
      // Update local state immediately (optimistic update)
      setAdjustedStrategies({
        ...adjustedStrategies,
        [dishName]: {
          ...currentStrategy,
          batch2Quantity: BigInt(newBatch2),
          batch3Quantity: BigInt(newBatch3),
        },
      });

      const percentChange = Math.abs(Math.round((multiplier - 1) * 100));
      const changeDirection = adjustmentType === "reduce" ? "reduced" : "increased";
      toast.success(
        `Remaining batches ${changeDirection} by ${percentChange}%`,
        {
          description: `${dishName}: Batch 2 (${Number(currentStrategy.batch2Quantity)}→${newBatch2}), Batch 3 (${Number(currentStrategy.batch3Quantity)}→${newBatch3})`,
          icon: adjustmentType === "reduce" ? 
            <TrendingDown className="w-4 h-4 text-orange-600" /> : 
            <TrendingUp className="w-4 h-4 text-green-600" />,
        }
      );

      // Call backend API
      const updatedStrategy = await adjustBatchQuantities.mutateAsync({
        eventId: eventIdBigInt,
        dishName,
        adjustmentType,
      });

      // Update with actual backend response
      setAdjustedStrategies({
        ...adjustedStrategies,
        [dishName]: updatedStrategy,
      });

    } catch (error) {
      console.error("Failed to adjust batch quantities:", error);
      
      // Revert optimistic update on error
      setAdjustedStrategies((prev) => {
        const newState = { ...prev };
        delete newState[dishName];
        return newState;
      });
      
      toast.error("Failed to adjust batch quantities. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <Card className="p-8">
          <p className="text-center text-muted-foreground">Event not found</p>
        </Card>
      </div>
    );
  }

  const batchStrategies = event.batchStrategies || [];
  
  // Merge adjusted strategies with original
  const displayStrategies = batchStrategies.map(strategy => 
    adjustedStrategies[strategy.dishName] || strategy
  );

  const groupedStrategies = displayStrategies.reduce((acc, strategy) => {
    if (!acc[strategy.dishCategory]) {
      acc[strategy.dishCategory] = [];
    }
    acc[strategy.dishCategory].push(strategy);
    return acc;
  }, {} as Record<string, BatchStrategy[]>);

  const completedBatch1Count = batchStrategies.filter(
    s => localProgress[s.dishName]?.batch1Complete
  ).length;
  const totalDishes = batchStrategies.length;
  const overallProgress = totalDishes > 0 ? Math.round((completedBatch1Count / totalDishes) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <header className="bg-gradient-to-r from-blue-600 to-teal-600 text-white py-6 shadow-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChefHat className="w-8 h-8" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Kitchen Team Dashboard</h1>
                <p className="text-sm text-white/90 mt-1">
                  {event.name}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.navigate({ to: `/dashboard/${eventId}` })}
              className="gap-2 hover:scale-105 transition-transform"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden md:inline">Back to Dashboard</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <Card className="shadow-lg border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-primary" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-primary">{completedBatch1Count}/{totalDishes}</p>
                <p className="text-sm text-muted-foreground mt-1">Dishes with Batch 1 Complete</p>
              </div>
              <Badge
                variant={event.status === EventStatus.cooking ? "default" : "secondary"}
                className="text-lg px-4 py-2"
              >
                {event.status.toUpperCase()}
              </Badge>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </CardContent>
        </Card>

        {event.alerts && event.alerts.length > 0 && (
          <Card className="shadow-md border-2 border-warning/30 bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-warning" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {event.alerts.map((alert, idx) => {
                  const isWarning = alert.toLowerCase().includes("low") || alert.toLowerCase().includes("reduce");
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg flex items-center gap-3 ${
                        isWarning
                          ? "bg-red-50 border-2 border-red-200"
                          : "bg-blue-50 border-2 border-blue-200"
                      }`}
                    >
                      <AlertCircle className={`w-5 h-5 ${isWarning ? "text-red-600" : "text-blue-600"}`} />
                      <p className={`font-medium ${isWarning ? "text-red-900" : "text-blue-900"}`}>
                        {alert}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {displayStrategies.length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedStrategies).map(([category, strategies]) => (
              <div key={category} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">{category}</h2>
                  <Badge variant="outline">{strategies.length} items</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {strategies.map((strategy, idx) => {
                    const progress = localProgress[strategy.dishName] || {
                      batch1Complete: false,
                      batch2Started: false,
                      batch2Complete: false,
                      batch3Started: false,
                    };
                    return (
                      <KitchenDishCard
                        key={idx}
                        strategy={strategy}
                        eventId={eventId || ""}
                        onBatchToggle={handleBatchToggle}
                        onAdjustBatch={handleAdjustBatch}
                        batch1Complete={progress.batch1Complete}
                        batch2Started={progress.batch2Started}
                        batch2Complete={progress.batch2Complete}
                        batch3Started={progress.batch3Started}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="shadow-md">
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">
                No batch strategies available yet. Make sure the menu has been approved.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground">
        © 2026. Built with <span className="text-red-500">♥</span> using{" "}
        <a
          href="https://caffeine.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
