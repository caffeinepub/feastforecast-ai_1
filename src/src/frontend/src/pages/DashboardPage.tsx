import { useState } from "react";
import { useParams, useRouter } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Tent,
  MapPin,
  Calendar,
  Cloud,
  Sun,
  CloudRain,
  Users,
  User,
  Baby,
  ChefHat,
  Bell,
  AlertTriangle,
  ArrowRight,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Utensils,
  AlertCircle,
  Sparkles,
  TrendingDown,
  Edit2,
} from "lucide-react";
import { useGetEventDashboard } from "@/hooks/useQueries";
import { RiskLevel } from "@/backend";
import type { BatchStrategy } from "@/backend";

const WEATHER_ICONS = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
};

// Map dish categories to food images
const getDishImage = (category: string, dishName: string): string => {
  const categoryLower = category.toLowerCase();
  const dishLower = dishName.toLowerCase();

  // Check for specific dishes first
  if (dishLower.includes("paneer tikka") || dishLower.includes("paneer-tikka")) {
    return "/assets/generated/paneer-tikka-starter.dim_600x400.png";
  }
  if (dishLower.includes("chicken tikka") || dishLower.includes("chicken-tikka")) {
    return "/assets/generated/chicken-tikka-starter.dim_600x400.png";
  }
  if (dishLower.includes("paneer") && (categoryLower.includes("main") || categoryLower.includes("curry"))) {
    return "/assets/generated/paneer-curry-main.dim_600x400.png";
  }
  if (dishLower.includes("butter chicken") || dishLower.includes("chicken") && categoryLower.includes("main")) {
    return "/assets/generated/butter-chicken-main.dim_600x400.png";
  }
  if (dishLower.includes("biryani") || categoryLower.includes("rice")) {
    return "/assets/generated/veg-biryani-rice.dim_600x400.png";
  }
  if (dishLower.includes("gulab jamun") || categoryLower.includes("dessert")) {
    return "/assets/generated/gulab-jamun-dessert.dim_600x400.png";
  }
  if (dishLower.includes("samosa") || categoryLower.includes("snack") || categoryLower.includes("appetizer")) {
    return "/assets/generated/samosas-snack.dim_600x400.png";
  }

  // Category fallbacks
  if (categoryLower.includes("starter") || categoryLower.includes("appetizer")) {
    return dishLower.includes("veg") || dishLower.includes("paneer")
      ? "/assets/generated/paneer-tikka-starter.dim_600x400.png"
      : "/assets/generated/chicken-tikka-starter.dim_600x400.png";
  }
  if (categoryLower.includes("main") || categoryLower.includes("curry")) {
    return dishLower.includes("veg") || dishLower.includes("paneer")
      ? "/assets/generated/paneer-curry-main.dim_600x400.png"
      : "/assets/generated/butter-chicken-main.dim_600x400.png";
  }
  if (categoryLower.includes("rice")) {
    return "/assets/generated/veg-biryani-rice.dim_600x400.png";
  }
  if (categoryLower.includes("dessert") || categoryLower.includes("sweet")) {
    return "/assets/generated/gulab-jamun-dessert.dim_600x400.png";
  }

  // Default fallback
  return "/assets/generated/samosas-snack.dim_600x400.png";
};

const getRiskBadgeColor = (risk: RiskLevel) => {
  switch (risk) {
    case RiskLevel.high:
      return "bg-red-100 text-red-800 border-red-200";
    case RiskLevel.medium:
      return "bg-orange-100 text-orange-800 border-orange-200";
    case RiskLevel.low:
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

interface BatchStrategyCardProps {
  strategy: BatchStrategy;
}

function BatchStrategyCard({ strategy }: BatchStrategyCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dishImage = getDishImage(strategy.dishCategory, strategy.dishName);

  const getRiskGlowClass = (risk: RiskLevel) => {
    switch (risk) {
      case RiskLevel.high:
        return "border-red-200 shadow-[0_0_15px_rgba(239,68,68,0.15)]";
      case RiskLevel.medium:
        return "border-orange-200 shadow-[0_0_15px_rgba(249,115,22,0.15)]";
      case RiskLevel.low:
        return "border-green-200 shadow-[0_0_15px_rgba(34,197,94,0.15)]";
      default:
        return "border-border";
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={`overflow-hidden shadow-lg hover:scale-[1.02] transition-all duration-300 border-2 ${getRiskGlowClass(strategy.riskLevel)}`}>
        <CollapsibleTrigger className="w-full">
          <div className="relative">
            <img
              src={dishImage}
              alt={strategy.dishName}
              className="w-full h-48 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/assets/generated/samosas-snack.dim_600x400.png";
              }}
            />
            <Badge
              className={`absolute top-3 right-3 ${getRiskBadgeColor(strategy.riskLevel)} border`}
            >
              {strategy.riskLevel.toUpperCase()} RISK
            </Badge>
          </div>
        </CollapsibleTrigger>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-1">{strategy.dishName}</CardTitle>
              <p className="text-sm text-muted-foreground">{strategy.dishCategory}</p>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-2 hover:scale-110 transition-transform">
                {isOpen ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Timeline-style Quick Summary */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/5 to-teal/5 rounded-xl border border-primary/10">
            <div className="text-center flex-1">
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                {Number(strategy.totalPortions)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total Portions</p>
            </div>
            <div className="h-12 w-px bg-border mx-2"></div>
            <div className="text-center flex-1">
              <div className="flex items-center justify-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <p className="text-2xl font-semibold text-foreground">{Number(strategy.batch1Quantity)}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Batch 1</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground mx-2" />
            <div className="text-center flex-1">
              <div className="flex items-center justify-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <p className="text-2xl font-semibold text-foreground">{Number(strategy.batch2Quantity)}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Batch 2</p>
            </div>
            {strategy.batch3Quantity > 0n && (
              <>
                <ArrowRight className="w-4 h-4 text-muted-foreground mx-2" />
                <div className="text-center flex-1">
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <p className="text-2xl font-semibold text-foreground">{Number(strategy.batch3Quantity)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Batch 3</p>
                </div>
              </>
            )}
          </div>

          {/* Progress Bar for Batch Flow */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Batch Progress</span>
              <span>Stage 1 of {strategy.batch3Quantity > 0n ? "3" : "2"}</span>
            </div>
            <Progress value={33} className="h-2" />
          </div>

          {/* Expanded Details */}
          <CollapsibleContent className="space-y-4 animate-accordion-down">
            {/* Batch 1 Details */}
            <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                Batch 1 - Initial Serving
              </div>
              <div className="pl-5 space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Utensils className="w-4 h-4" />
                  <span>Quantity: <strong className="text-foreground">{Number(strategy.batch1Quantity)} portions</strong></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Start: <strong className="text-foreground">{strategy.batch1StartTime}</strong></span>
                </div>
              </div>
            </div>

            {/* Trigger Condition */}
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-1">
                  Trigger Condition
                </p>
                <p className="text-sm text-foreground">{strategy.triggerCondition}</p>
              </div>
            </div>

            {/* Batch 2 Details */}
            <div className="space-y-2 p-3 bg-orange-50 rounded-lg border border-orange-100">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                Batch 2 - Secondary Serving
              </div>
              <div className="pl-5 space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Utensils className="w-4 h-4" />
                  <span>Quantity: <strong className="text-foreground">{Number(strategy.batch2Quantity)} portions</strong></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Timing: <strong className="text-foreground">{strategy.batch2Timing}</strong></span>
                </div>
              </div>
            </div>

            {/* Batch 3 (if exists) */}
            {strategy.batch3Quantity > 0n && (
              <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  Batch 3 - Final Serving
                </div>
                <div className="pl-5 space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Utensils className="w-4 h-4" />
                    <span>Quantity: <strong className="text-foreground">{Number(strategy.batch3Quantity)} portions</strong></span>
                  </div>
                </div>
              </div>
            )}

            {/* Adjustment Strategy */}
            <div className="p-3 bg-gradient-to-r from-blue-50 to-teal-50 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                    Adjustment Strategy
                  </p>
                  <p className="text-sm text-foreground">{strategy.adjustmentStrategy}</p>
                </div>
              </div>
            </div>

            {/* Cooking Timing Suggestion */}
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-green-900 uppercase tracking-wide mb-1">
                    Cooking Timing
                  </p>
                  <p className="text-sm text-foreground">{strategy.cookingTimingSuggestion}</p>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}

export function DashboardPage() {
  const { eventId } = useParams({ strict: false });
  const router = useRouter();
  const eventIdBigInt = eventId ? BigInt(eventId) : null;

  const { data: event, isLoading } = useGetEventDashboard(eventIdBigInt);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="space-y-4 mb-8">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-6 w-96" />
          </div>
          {/* AI Loading State */}
          <Card className="mb-8 shadow-lg border-2 border-primary/20 bg-gradient-to-br from-blue-50 to-teal-50 animate-pulse-slow">
            <CardContent className="py-12 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Sparkles className="w-8 h-8 text-primary animate-pulse-slow" />
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              </div>
              <p className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">
                Calculating batch strategies...
              </p>
              <p className="text-sm text-muted-foreground">
                AI is optimizing cooking schedules to reduce waste
              </p>
            </CardContent>
          </Card>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="p-8">
          <p className="text-center text-muted-foreground">Event not found</p>
        </Card>
      </div>
    );
  }

  const WeatherIcon = WEATHER_ICONS[event.weather];
  const eventDate = new Date(Number(event.date) / 1_000_000);
  const batchStrategies = event.batchStrategies || [];

  // Group strategies by category
  const groupedStrategies = batchStrategies.reduce((acc, strategy) => {
    if (!acc[strategy.dishCategory]) {
      acc[strategy.dishCategory] = [];
    }
    acc[strategy.dishCategory].push(strategy);
    return acc;
  }, {} as Record<string, BatchStrategy[]>);

  // Extract high-risk dishes for waste prevention section
  const highRiskDishes = batchStrategies.filter(s => s.riskLevel === RiskLevel.high);
  const mediumRiskDishes = batchStrategies.filter(s => s.riskLevel === RiskLevel.medium);
  const lowRiskDishes = batchStrategies.filter(s => s.riskLevel === RiskLevel.low);

  // Calculate estimated waste reduction percentage
  const totalDishes = batchStrategies.length;
  const estimatedWasteReduction = totalDishes > 0 
    ? Math.round(((highRiskDishes.length * 15) + (mediumRiskDishes.length * 8) + (lowRiskDishes.length * 3)) / totalDishes)
    : 0;

  // Calculate AI confidence score (70% base + bonuses for data completeness)
  let confidenceScore = 70;
  if (event.dietaryRequirements.length > 0) confidenceScore += 5;
  if (event.menuDescription) confidenceScore += 5;
  if (event.eventType) confidenceScore += 5;
  if (event.cuisinePreference) confidenceScore += 5;
  if (batchStrategies.length >= 10) confidenceScore += 5;
  if (batchStrategies.length >= 15) confidenceScore += 5;

  // Validate portion sizes (portions should not exceed guest count for non-drink dishes)
  const portionValidation = batchStrategies.map(strategy => {
    const guestCount = Number(event.guestCount);
    const totalPortions = Number(strategy.totalPortions);
    const isDrink = strategy.dishCategory.toLowerCase().includes("drink");
    const isReasonable = isDrink || totalPortions <= guestCount * 0.9;
    
    return {
      dishName: strategy.dishName,
      totalPortions,
      guestCount,
      isReasonable,
      isWarning: !isReasonable,
    };
  });

  const hasPortionWarnings = portionValidation.some(v => v.isWarning);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-teal-600 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChefHat className="w-8 h-8" />
              <h1 className="text-3xl font-bold">FeastForecast AI Dashboard</h1>
            </div>
            <Button
              variant="secondary"
              onClick={() => router.navigate({ to: `/kitchen/${eventId}` })}
              className="gap-2 hover:scale-105 transition-transform"
            >
              <ChefHat className="w-4 h-4" />
              Kitchen View
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* AI Insights Summary Card */}
        <Card className="shadow-lg border-2 border-primary/20 bg-gradient-to-br from-blue-50 to-teal-50 animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="w-6 h-6 text-primary" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Utensils className="w-5 h-5 text-blue-600" />
                  <p className="text-4xl font-bold text-blue-600">{batchStrategies.length}</p>
                </div>
                <p className="text-sm text-muted-foreground">Total Dishes</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-green-600" />
                  <p className="text-4xl font-bold text-green-600">~{estimatedWasteReduction}%</p>
                </div>
                <p className="text-sm text-muted-foreground">Waste Reduction</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="text-4xl font-bold text-red-600">{highRiskDishes.length}</p>
                </div>
                <p className="text-sm text-muted-foreground">High-Risk Dishes</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-teal-600" />
                  <p className="text-4xl font-bold text-teal-600">{confidenceScore}%</p>
                </div>
                <p className="text-sm text-muted-foreground">AI Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portion Validation Warning */}
        {hasPortionWarnings && (
          <Card className="shadow-md border-2 border-orange-300 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Portion Validation Warning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Some dishes have portion counts that seem high compared to guest count. Review and adjust if needed.
              </p>
              <div className="space-y-2">
                {portionValidation
                  .filter(v => v.isWarning)
                  .map((validation, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200"
                    >
                      <span className="font-medium text-foreground">{validation.dishName}</span>
                      <Badge variant="outline" className="text-orange-800">
                        {validation.totalPortions} portions for {validation.guestCount} guests
                      </Badge>
                    </div>
                  ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => router.navigate({ to: `/menu-approval/${eventId}` })}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Review Menu
              </Button>
            </CardContent>
          </Card>
        )}
        {/* Event Overview Card */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tent className="w-5 h-5 text-primary" />
              Event Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-2xl font-bold text-foreground">{event.name}</p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {eventDate.toLocaleDateString()} at {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-4">
                <div className="text-center">
                  <WeatherIcon className="w-12 h-12 text-primary mx-auto mb-1" />
                  <p className="text-sm text-muted-foreground capitalize">{event.weather}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{Number(event.temperature)}°C</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guest Analysis Card */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Guest Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-5xl font-bold text-primary mb-2">{Number(event.guestCount)}</p>
                <p className="text-sm text-muted-foreground">Expected Guests</p>
              </div>
              <div className="flex gap-8">
                <div className="text-center">
                  <User className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                  <p className="text-xl font-semibold text-foreground">{Number(event.adultPercentage)}%</p>
                  <p className="text-sm text-muted-foreground">Adults</p>
                </div>
                <div className="text-center">
                  <Baby className="w-10 h-10 text-pink-600 mx-auto mb-2" />
                  <p className="text-xl font-semibold text-foreground">{Number(event.kidPercentage)}%</p>
                  <p className="text-sm text-muted-foreground">Kids</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Waste Prevention Strategy Summary */}
        {highRiskDishes.length > 0 && (
          <Card className="shadow-md border-2 border-warning/30 bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning-foreground">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Waste Prevention Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground mb-3">
                High-risk dishes identified. Follow batch cooking recommendations to minimize waste.
              </p>
              <div className="space-y-2">
                {highRiskDishes.map((dish, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-background rounded-lg border border-border"
                  >
                    <AlertCircle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">{dish.dishName}</p>
                      <p className="text-sm text-muted-foreground">{dish.cookingTimingSuggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Batch Strategy Cards by Category */}
        {batchStrategies.length > 0 ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Smart Batch Cooking Strategy</h2>
              <Badge variant="secondary" className="text-sm">
                {batchStrategies.length} dishes
              </Badge>
            </div>

            {Object.entries(groupedStrategies).map(([category, strategies]) => (
              <div key={category} className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-primary" />
                  {category}
                  <Badge variant="outline" className="ml-2">
                    {strategies.length} items
                  </Badge>
                </h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {strategies.map((strategy, idx) => (
                    <BatchStrategyCard key={idx} strategy={strategy} />
                  ))}
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

        {/* Alert System */}
        {event.alerts && event.alerts.length > 0 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Live Alerts
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
                          ? "bg-red-50 border border-red-200"
                          : "bg-blue-50 border border-blue-200"
                      }`}
                    >
                      <Bell className={`w-5 h-5 ${isWarning ? "text-red-600" : "text-blue-600"}`} />
                      <p className={`text-sm font-medium ${isWarning ? "text-red-900" : "text-blue-900"}`}>
                        {alert}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
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
