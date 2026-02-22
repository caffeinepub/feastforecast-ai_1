import { useState, useEffect } from "react";
import { useParams, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, CheckCircle2, Edit2, ChefHat, Trash2, Plus, RefreshCw, ChevronDown, MessageSquare, Sparkles } from "lucide-react";
import { useGenerateMenuSuggestions, useSaveApprovedMenu, useCalculateBatchStrategies, useGetEventDashboard } from "@/hooks/useQueries";
import { toast } from "sonner";
import { DietaryRequirement } from "@/backend";
import type { MenuItem } from "@/backend";

const DISH_EMOJIS: Record<string, string> = {
  "VegStarter": "🥗",
  "NonVegStarter": "🍗",
  "MainCourse": "🍛",
  "Dessert": "🍰",
  "Drinks": "🥤",
};

const MULTIPLIERS = {
  VegStarter: 0.65,
  NonVegStarter: 0.65,
  MainCourse: 0.85,
  Dessert: 0.55,
  Drinks: 1.3,
};

// Calculate realistic portions for all dishes based on guest count
const calculateRealisticPortions = (
  guestCount: number,
  dishes: MenuItem[]
): MenuItem[] => {
  // Group dishes by category to get accurate category counts
  const categoryCounts: Record<string, number> = {};
  dishes.forEach(dish => {
    categoryCounts[dish.category] = (categoryCounts[dish.category] || 0) + 1;
  });

  return dishes.map(dish => {
    // Preserve manual edits
    if (dish.isManuallyEdited) {
      return dish;
    }
    
    const multiplier = MULTIPLIERS[dish.category as keyof typeof MULTIPLIERS] || 0.65;
    const categoryCount = categoryCounts[dish.category] || 1;
    const newPortions = Math.round((guestCount * multiplier) / categoryCount);
    
    console.log(`Calculated ${dish.name} (${dish.category}): ${guestCount} guests × ${multiplier} ÷ ${categoryCount} dishes = ${newPortions} portions`);
    
    return {
      ...dish,
      estimatedPortions: BigInt(newPortions),
    };
  });
};

export function MenuApprovalPage() {
  const { eventId } = useParams({ strict: false });
  const router = useRouter();
  const eventIdBigInt = eventId ? BigInt(eventId) : null;

  const { data: suggestions, isLoading, refetch: regenerateMenu } = useGenerateMenuSuggestions(eventIdBigInt);
  const { data: event } = useGetEventDashboard(eventIdBigInt);
  const saveApprovedMenu = useSaveApprovedMenu();
  const calculateBatchStrategies = useCalculateBatchStrategies();

  const [editedItems, setEditedItems] = useState<MenuItem[]>([]);
  const [categoryComments, setCategoryComments] = useState<Record<string, string>>({});
  const [selectedDietaryFilters, setSelectedDietaryFilters] = useState<DietaryRequirement[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Track current category counts from edited items
  const [currentCategoryCounts, setCurrentCategoryCounts] = useState({
    VegStarter: 0,
    NonVegStarter: 0,
    MainCourse: 0,
    Dessert: 0,
    Drinks: 0,
  });

  useEffect(() => {
    if (suggestions && event) {
      console.log("=== Menu suggestions received from backend ===");
      console.log("Backend portions (should be 0):", suggestions.map(s => `${s.name}: ${Number(s.estimatedPortions)}`));
      
      // Calculate realistic portions immediately on load
      const guestCount = Number(event.guestCount);
      const withCalculatedPortions = calculateRealisticPortions(guestCount, suggestions);
      
      console.log("=== Calculated realistic portions ===");
      withCalculatedPortions.forEach((item, idx) => {
        console.log(`  [${idx}] ${item.name}: ${Number(item.estimatedPortions)} portions (manually edited: ${item.isManuallyEdited})`);
      });
      
      setEditedItems(withCalculatedPortions);
      updateCategoryCounts(withCalculatedPortions);
    }
  }, [suggestions, event]);

  // Recalculate portions when guest count changes (preserving manual edits)
  useEffect(() => {
    if (event && editedItems.length > 0) {
      const guestCount = Number(event.guestCount);
      const recalculated = calculateRealisticPortions(guestCount, editedItems);
      
      // Only update if values actually changed (avoid infinite loops)
      const hasChanges = recalculated.some((dish, idx) => {
        const currentPortions = Number(editedItems[idx]?.estimatedPortions || 0);
        const newPortions = Number(dish.estimatedPortions);
        return currentPortions !== newPortions && !dish.isManuallyEdited;
      });
      
      if (hasChanges) {
        console.log("=== Recalculating portions (manual edits preserved) ===");
        setEditedItems(recalculated);
        toast.info("Portions recalculated (manual edits preserved)", { duration: 2000 });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.guestCount, currentCategoryCounts]);

  const updateCategoryCounts = (items: MenuItem[]) => {
    const counts = {
      VegStarter: items.filter(i => i.category === "VegStarter").length,
      NonVegStarter: items.filter(i => i.category === "NonVegStarter").length,
      MainCourse: items.filter(i => i.category === "MainCourse").length,
      Dessert: items.filter(i => i.category === "Dessert").length,
      Drinks: items.filter(i => i.category === "Drinks").length,
    };
    setCurrentCategoryCounts(counts);
  };

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
          isManuallyEdited: true // Mark as manually edited when user changes portions
        };
        
        console.log(`Manually edited ${updated[index].name}: ${portions} portions`);
        
        // Instant batch recalculation on portion edit
        if (eventIdBigInt && portions !== Number(prevItems[index].estimatedPortions)) {
          toast.info("Portion updated - batch strategies will recalculate on approval", { duration: 1500 });
        }
      }
      return updated;
    });
  };

  const handleRemoveDish = (index: number) => {
    const dishName = editedItems[index].name;
    setEditedItems(prevItems => {
      const updated = prevItems.filter((_, i) => i !== index);
      
      // Recalculate portions for remaining dishes in affected category
      if (event) {
        const guestCount = Number(event.guestCount);
        const recalculated = calculateRealisticPortions(guestCount, updated);
        updateCategoryCounts(recalculated);
        toast.success(`Removed "${dishName}" - portions recalculated for remaining dishes`);
        return recalculated;
      }
      
      updateCategoryCounts(updated);
      toast.success(`Removed "${dishName}" from menu`);
      return updated;
    });
  };

  const handleAddDish = (category: string) => {
    const guestCount = event ? Number(event.guestCount) : 100;
    const multiplier = MULTIPLIERS[category as keyof typeof MULTIPLIERS] || 0.65;
    
    // Calculate realistic default portion for the new dish
    // (count includes the new dish we're adding)
    const currentCategoryCount = editedItems.filter(d => d.category === category).length;
    const newCategoryCount = currentCategoryCount + 1;
    const defaultPortion = Math.round((guestCount * multiplier) / newCategoryCount);
    
    console.log(`Adding dish to ${category}: ${guestCount} guests × ${multiplier} ÷ ${newCategoryCount} dishes = ${defaultPortion} portions`);
    
    const newDish: MenuItem = {
      name: "New Dish",
      category,
      estimatedPortions: BigInt(defaultPortion),
      isManuallyEdited: false,
    };
    
    setEditedItems(prevItems => {
      const updated = [...prevItems, newDish];
      // Recalculate all non-edited dishes in this category to distribute portions fairly
      const recalculated = calculateRealisticPortions(guestCount, updated);
      updateCategoryCounts(recalculated);
      return recalculated;
    });
    
    toast.success(`Added new dish to ${category} with ~${defaultPortion} portions`);
  };

  const handleSwapDish = (index: number) => {
    toast.info("Swap functionality coming soon! You can edit the dish name for now.");
  };

  const handleDietaryFilterToggle = (filter: DietaryRequirement) => {
    if (selectedDietaryFilters.includes(filter)) {
      setSelectedDietaryFilters(selectedDietaryFilters.filter(f => f !== filter));
      toast.info(`Removed ${filter} filter`);
    } else {
      setSelectedDietaryFilters([...selectedDietaryFilters, filter]);
      toast.info(`Applied ${filter} filter. Dishes affected will be marked.`);
    }
  };

  const handleRegenerateMenu = async () => {
    setIsRegenerating(true);
    const excludedDishes = editedItems.map(item => item.name);
    
    try {
      toast.info("Generating fresh menu avoiding duplicates...", {
        duration: 2000,
      });
      
      // Note: The backend should use current category counts, cuisine, and dietary filters
      // For now, we trigger the standard regeneration which respects original event parameters
      await regenerateMenu();
      
      toast.success("Menu regenerated with fresh dishes!");
    } catch (error) {
      console.error("Failed to regenerate menu:", error);
      toast.error("Failed to regenerate menu");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!eventIdBigInt) return;

    if (editedItems.length === 0) {
      toast.error("Cannot approve an empty menu");
      return;
    }

    try {
      await saveApprovedMenu.mutateAsync({
        eventId: eventIdBigInt,
        approvedMenu: editedItems,
      });
      toast.success("Menu approved! Calculating batch strategies...");
      
      // Calculate batch strategies
      await calculateBatchStrategies.mutateAsync(eventIdBigInt);
      
      router.navigate({ to: `/dashboard/${eventId}` });
    } catch (error) {
      console.error("Failed to save approved menu:", error);
      toast.error("Failed to approve menu. Please try again.");
    }
  };

  const groupedItems = editedItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Calculate realistic portion preview
  const getPortionPreview = (category: string, dishCount: number) => {
    if (!event || dishCount === 0) return null;
    
    const guestCount = Number(event.guestCount);
    const multiplier = MULTIPLIERS[category as keyof typeof MULTIPLIERS] || 0.65;
    const totalServings = Math.round(guestCount * multiplier);
    const portionsPerDish = Math.round(totalServings / dishCount);
    
    const isReasonable = portionsPerDish >= 10 && portionsPerDish <= guestCount * 0.8;
    
    return {
      totalServings,
      portionsPerDish,
      isReasonable,
      formula: `(${guestCount} guests × ${multiplier}) ÷ ${dishCount} dishes`,
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="space-y-4 mb-8">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-6 w-96" />
          </div>
          {/* AI Loading State */}
          <Card className="mb-8 shadow-lg border-2 border-primary/20 bg-gradient-to-br from-blue-50 to-teal-50 animate-shimmer">
            <CardContent className="py-12 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                  Analyzing event requirements...
                </p>
                <p className="text-sm text-muted-foreground animate-pulse">
                  Calculating realistic portions...
                </p>
                <p className="text-sm text-muted-foreground animate-pulse delay-100">
                  Selecting dishes from cuisine pool...
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in-up">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ChefHat className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                Menu Approval
              </h1>
            </div>
            <p className="text-muted-foreground">
              Review and customize your AI-generated menu items
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.navigate({ to: "/" })}
            className="gap-2 hover:scale-105 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Form
          </Button>
        </div>

        {/* Dietary Filters */}
        <Card className="mb-6 shadow-lg border-2 border-primary/10 animate-scale-in">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-primary" />
              Dietary Filters
            </CardTitle>
            <CardDescription>
              Apply dietary requirements to mark affected dishes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-jain"
                  checked={selectedDietaryFilters.includes(DietaryRequirement.jain)}
                  onCheckedChange={() => handleDietaryFilterToggle(DietaryRequirement.jain)}
                />
                <Label htmlFor="filter-jain" className="font-normal cursor-pointer">
                  Jain (no onion/garlic)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-vegan"
                  checked={selectedDietaryFilters.includes(DietaryRequirement.vegan)}
                  onCheckedChange={() => handleDietaryFilterToggle(DietaryRequirement.vegan)}
                />
                <Label htmlFor="filter-vegan" className="font-normal cursor-pointer">
                  Vegan (no dairy/eggs)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-glutenFree"
                  checked={selectedDietaryFilters.includes(DietaryRequirement.glutenFree)}
                  onCheckedChange={() => handleDietaryFilterToggle(DietaryRequirement.glutenFree)}
                />
                <Label htmlFor="filter-glutenFree" className="font-normal cursor-pointer">
                  Gluten-Free (no wheat)
                </Label>
              </div>
            </div>
            {selectedDietaryFilters.length > 0 && (
              <p className="text-xs text-warning mt-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Full dietary filtering coming soon. Affected dishes will be marked with badges.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Menu Categories */}
        <div className="grid gap-6 mb-8">
          {Object.entries(groupedItems).map(([category, items]) => {
            const portionPreview = getPortionPreview(category, items.length);
            
            return (
              <Collapsible key={category} defaultOpen>
                <Card className="shadow-lg border-2 border-transparent hover:border-primary/20 transition-all">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <span className="text-2xl">{DISH_EMOJIS[category] || "🍽️"}</span>
                        {category}
                        <Badge variant="secondary" className="ml-2">{items.length} items</Badge>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddDish(category)}
                          className="gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </Button>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </div>
                    {/* Portion Calculation Preview */}
                    {portionPreview && (
                      <div className={`mt-3 p-3 rounded-lg border text-sm ${
                        portionPreview.isReasonable 
                          ? "bg-green-50 border-green-200" 
                          : "bg-orange-50 border-orange-200"
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-foreground">
                            ~{portionPreview.portionsPerDish} portions per dish
                          </span>
                          <Badge 
                            variant={portionPreview.isReasonable ? "secondary" : "default"}
                            className="text-xs"
                          >
                            {portionPreview.totalServings} total
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {portionPreview.formula} = {portionPreview.portionsPerDish} each
                        </p>
                        {!portionPreview.isReasonable && (
                          <p className="text-xs text-orange-800 mt-1 font-medium">
                            ⚠️ Consider adjusting dish count for realistic portions
                          </p>
                        )}
                      </div>
                    )}
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="space-y-4">
                        {items.map((item, idx) => {
                          const globalIndex = editedItems.findIndex(
                            (i) => i.name === item.name && i.category === item.category
                          );
                          const affectedByDiet = selectedDietaryFilters.length > 0 && 
                            (item.name.toLowerCase().includes("onion") || 
                             item.name.toLowerCase().includes("garlic") || 
                             item.name.toLowerCase().includes("paneer"));
                          
                          return (
                            <div
                              key={idx}
                              className="p-4 border border-border rounded-xl bg-card hover:shadow-md transition-all hover:scale-[1.01]"
                            >
                              <div className="grid md:grid-cols-[2fr_1fr_auto] gap-4 items-center">
                                <div className="space-y-2">
                                  <Label htmlFor={`name-${globalIndex}`} className="text-xs text-muted-foreground">
                                    Dish Name
                                  </Label>
                                  <div className="relative">
                                    <Input
                                      id={`name-${globalIndex}`}
                                      value={item.name}
                                      onChange={(e) =>
                                        handleUpdateItem(globalIndex, "name", e.target.value)
                                      }
                                      className="pr-8"
                                    />
                                    <Edit2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  </div>
                                  {affectedByDiet && (
                                    <Badge variant="outline" className="text-xs">
                                      Would modify for dietary filter
                                    </Badge>
                                  )}
                                  {item.isManuallyEdited && (
                                    <Badge variant="outline" className="text-xs bg-blue-50 border-blue-300 text-blue-800 flex items-center gap-1 w-fit">
                                      <Edit2 className="w-3 h-3" />
                                      Manually Adjusted
                                    </Badge>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`portions-${globalIndex}`} className="text-xs text-muted-foreground">
                                    Estimated Portions
                                  </Label>
                                  <Input
                                    id={`portions-${globalIndex}`}
                                    type="number"
                                    min="0"
                                    value={Number(item.estimatedPortions)}
                                    onChange={(e) =>
                                      handleUpdateItem(globalIndex, "estimatedPortions", e.target.value)
                                    }
                                    className="text-center font-semibold"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleSwapDish(globalIndex)}
                                    className="shrink-0 hover:scale-110 transition-transform"
                                    title="Swap dish"
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleRemoveDish(globalIndex)}
                                    className="shrink-0 hover:scale-110 transition-transform text-destructive hover:text-destructive"
                                    title="Remove dish"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Category Comment Box */}
                      <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                        <Label htmlFor={`comment-${category}`} className="text-xs text-muted-foreground mb-2 block">
                          <MessageSquare className="w-3 h-3 inline mr-1" />
                          Customization notes for {category}
                        </Label>
                        <Textarea
                          id={`comment-${category}`}
                          placeholder="Add specific instructions (e.g., less spicy, Jain version, local preference...)"
                          value={categoryComments[category] || ""}
                          onChange={(e) => setCategoryComments({ ...categoryComments, [category]: e.target.value })}
                          rows={2}
                          className="text-sm resize-none"
                        />
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
          <Button
            variant="outline"
            size="lg"
            onClick={handleRegenerateMenu}
            disabled={isRegenerating}
            className="gap-2 hover:scale-105 transition-transform"
          >
            <RefreshCw className={`w-5 h-5 ${isRegenerating ? "animate-spin" : ""}`} />
            {isRegenerating ? "Regenerating..." : "Regenerate Menu"}
          </Button>
          <Button
            size="lg"
            onClick={handleApprove}
            disabled={saveApprovedMenu.isPending || calculateBatchStrategies.isPending || editedItems.length === 0}
            className="gap-2 px-8 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 hover:scale-105 transition-all shadow-lg shadow-blue-500/20"
          >
            <CheckCircle2 className="w-5 h-5" />
            {saveApprovedMenu.isPending || calculateBatchStrategies.isPending ? "Processing..." : "Approve & Generate Strategy"}
          </Button>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-muted-foreground">
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
    </div>
  );
}
