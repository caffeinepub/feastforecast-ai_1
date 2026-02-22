import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Calendar, MapPin, Users, Thermometer, CloudSun, Clock, ChefHat, Tent } from "lucide-react";
import { useCreateEvent } from "@/hooks/useQueries";
import { MealTime, Weather, EventType, CuisinePreference, DietaryRequirement } from "@/backend";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

export function EventInputPage() {
  const router = useRouter();
  const createEvent = useCreateEvent();

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    date: "",
    guestCount: "100",
    adultPercentage: 70,
    temperature: "25",
    mealTime: "lunch" as MealTime,
    weather: "sunny" as Weather,
    menuDescription: "",
    vegStarters: 0,
    nonVegStarters: 0,
    mainCourse: 0,
    desserts: 0,
    drinks: 0,
    eventType: "" as EventType | "",
    cuisinePreference: "" as CuisinePreference | "",
    dietaryRequirements: [] as DietaryRequirement[],
  });

  const kidPercentage = 100 - formData.adultPercentage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.location || !formData.date) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!formData.eventType) {
      toast.error("Please select an event type");
      return;
    }

    if (!formData.cuisinePreference) {
      toast.error("Please select a cuisine preference");
      return;
    }

    const totalCategories = formData.vegStarters + formData.nonVegStarters + formData.mainCourse + formData.desserts + formData.drinks;
    if (totalCategories === 0) {
      toast.error("Please add at least one dish category");
      return;
    }

    try {
      // Convert date string to timestamp (nanoseconds)
      const dateMs = new Date(formData.date).getTime();
      const dateNs = BigInt(dateMs) * BigInt(1_000_000);

      const eventId = await createEvent.mutateAsync({
        name: formData.name,
        location: formData.location,
        date: dateNs,
        guestCount: BigInt(formData.guestCount),
        adultPercentage: BigInt(formData.adultPercentage),
        kidPercentage: BigInt(kidPercentage),
        mealTime: formData.mealTime,
        weather: formData.weather,
        temperature: BigInt(formData.temperature),
        menuDescription: formData.menuDescription,
        vegStarters: BigInt(formData.vegStarters),
        nonVegStarters: BigInt(formData.nonVegStarters),
        mainCourse: BigInt(formData.mainCourse),
        desserts: BigInt(formData.desserts),
        drinks: BigInt(formData.drinks),
        eventType: formData.eventType as EventType,
        cuisinePreference: formData.cuisinePreference as CuisinePreference,
        dietaryRequirements: formData.dietaryRequirements,
      });

      toast.success("Event created successfully!");
      router.navigate({ to: `/menu-approval/${eventId.toString()}` });
    } catch (error) {
      console.error("Failed to create event:", error);
      toast.error("Failed to create event. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ChefHat className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              FeastForecast AI
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Smart event planning to reduce food waste
          </p>
        </div>

        <Card className="shadow-xl border-2 border-primary/10 animate-scale-in">
          <CardHeader>
            <CardTitle className="text-2xl">Create New Event</CardTitle>
            <CardDescription>
              Enter your event details to get AI-powered menu recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4" />
                  Event Name *
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Annual Company Dinner"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location *
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., Grand Ballroom, Marriott Hotel"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>

              {/* Event Date */}
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Event Date *
                </Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              {/* Expected Guests */}
              <div className="space-y-2">
                <Label htmlFor="guestCount" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Expected Guests *
                </Label>
                <Input
                  id="guestCount"
                  type="number"
                  min="1"
                  placeholder="e.g., 500"
                  value={formData.guestCount}
                  onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                  required
                />
              </div>

              {/* Age Distribution */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Age Distribution
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Adults: {formData.adultPercentage}%</span>
                    <span className="text-sm text-muted-foreground">Kids: {kidPercentage}%</span>
                  </div>
                  <Slider
                    value={[formData.adultPercentage]}
                    onValueChange={([value]) => setFormData({ ...formData, adultPercentage: value })}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Meal Time */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Meal Time *
                </Label>
                <RadioGroup
                  value={formData.mealTime}
                  onValueChange={(value) => setFormData({ ...formData, mealTime: value as MealTime })}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lunch" id="lunch" />
                    <Label htmlFor="lunch" className="font-normal cursor-pointer">Lunch</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dinner" id="dinner" />
                    <Label htmlFor="dinner" className="font-normal cursor-pointer">Dinner</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Weather */}
              <div className="space-y-2">
                <Label htmlFor="weather" className="flex items-center gap-2">
                  <CloudSun className="w-4 h-4" />
                  Weather Forecast *
                </Label>
                <Select
                  value={formData.weather}
                  onValueChange={(value) => setFormData({ ...formData, weather: value as Weather })}
                >
                  <SelectTrigger id="weather">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunny">☀️ Sunny</SelectItem>
                    <SelectItem value="cloudy">☁️ Cloudy</SelectItem>
                    <SelectItem value="rainy">🌧️ Rainy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <Label htmlFor="temperature" className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4" />
                  Temperature (°C) *
                </Label>
                <Input
                  id="temperature"
                  type="number"
                  placeholder="e.g., 25"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                  required
                />
              </div>

              {/* Event Type */}
              <div className="space-y-2">
                <Label htmlFor="eventType" className="flex items-center gap-2">
                  <Tent className="w-4 h-4" />
                  Event Type *
                </Label>
                <Select
                  value={formData.eventType}
                  onValueChange={(value) => setFormData({ ...formData, eventType: value as EventType })}
                >
                  <SelectTrigger id="eventType">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EventType.wedding}>Wedding</SelectItem>
                    <SelectItem value={EventType.corporate}>Corporate Event</SelectItem>
                    <SelectItem value={EventType.schoolFunction}>School Function</SelectItem>
                    <SelectItem value={EventType.birthday}>Birthday Party</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cuisine Preference */}
              <div className="space-y-2">
                <Label htmlFor="cuisinePreference" className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4" />
                  Cuisine Preference *
                </Label>
                <Select
                  value={formData.cuisinePreference}
                  onValueChange={(value) => setFormData({ ...formData, cuisinePreference: value as CuisinePreference })}
                >
                  <SelectTrigger id="cuisinePreference">
                    <SelectValue placeholder="Select cuisine preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CuisinePreference.northIndian}>North Indian</SelectItem>
                    <SelectItem value={CuisinePreference.southIndian}>South Indian</SelectItem>
                    <SelectItem value={CuisinePreference.chinese}>Chinese</SelectItem>
                    <SelectItem value={CuisinePreference.continental}>Continental</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dietary Requirements */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Dietary Requirements (Optional)
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="jain"
                      checked={formData.dietaryRequirements.includes(DietaryRequirement.jain)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            dietaryRequirements: [...formData.dietaryRequirements, DietaryRequirement.jain],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            dietaryRequirements: formData.dietaryRequirements.filter(
                              (req) => req !== DietaryRequirement.jain
                            ),
                          });
                        }
                      }}
                    />
                    <Label htmlFor="jain" className="font-normal cursor-pointer">
                      Jain (no onion/garlic)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vegan"
                      checked={formData.dietaryRequirements.includes(DietaryRequirement.vegan)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            dietaryRequirements: [...formData.dietaryRequirements, DietaryRequirement.vegan],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            dietaryRequirements: formData.dietaryRequirements.filter(
                              (req) => req !== DietaryRequirement.vegan
                            ),
                          });
                        }
                      }}
                    />
                    <Label htmlFor="vegan" className="font-normal cursor-pointer">
                      Vegan (no dairy/eggs)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="glutenFree"
                      checked={formData.dietaryRequirements.includes(DietaryRequirement.glutenFree)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            dietaryRequirements: [...formData.dietaryRequirements, DietaryRequirement.glutenFree],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            dietaryRequirements: formData.dietaryRequirements.filter(
                              (req) => req !== DietaryRequirement.glutenFree
                            ),
                          });
                        }
                      }}
                    />
                    <Label htmlFor="glutenFree" className="font-normal cursor-pointer">
                      Gluten-Free (no wheat)
                    </Label>
                  </div>
                </div>
              </div>

              {/* Menu Categories */}
              <div className="space-y-4 p-4 bg-primary/5 rounded-xl border-2 border-primary/10">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-primary" />
                  <Label className="text-base font-semibold">Menu Categories *</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Specify how many dishes you want in each category. Our AI will generate specific recommendations.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vegStarters" className="text-sm">
                      🥗 Veg Starters
                    </Label>
                    <Input
                      id="vegStarters"
                      type="number"
                      min="0"
                      max="20"
                      value={formData.vegStarters}
                      onChange={(e) => setFormData({ ...formData, vegStarters: parseInt(e.target.value) || 0 })}
                      className="text-center font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nonVegStarters" className="text-sm">
                      🍗 Non-Veg Starters
                    </Label>
                    <Input
                      id="nonVegStarters"
                      type="number"
                      min="0"
                      max="20"
                      value={formData.nonVegStarters}
                      onChange={(e) => setFormData({ ...formData, nonVegStarters: parseInt(e.target.value) || 0 })}
                      className="text-center font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mainCourse" className="text-sm">
                      🍛 Main Course
                    </Label>
                    <Input
                      id="mainCourse"
                      type="number"
                      min="0"
                      max="20"
                      value={formData.mainCourse}
                      onChange={(e) => setFormData({ ...formData, mainCourse: parseInt(e.target.value) || 0 })}
                      className="text-center font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desserts" className="text-sm">
                      🍰 Desserts
                    </Label>
                    <Input
                      id="desserts"
                      type="number"
                      min="0"
                      max="10"
                      value={formData.desserts}
                      onChange={(e) => setFormData({ ...formData, desserts: parseInt(e.target.value) || 0 })}
                      className="text-center font-semibold"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="drinks" className="text-sm">
                      🥤 Drinks
                    </Label>
                    <Input
                      id="drinks"
                      type="number"
                      min="0"
                      max="20"
                      value={formData.drinks}
                      onChange={(e) => setFormData({ ...formData, drinks: parseInt(e.target.value) || 0 })}
                      className="text-center font-semibold"
                    />
                  </div>
                </div>
                {(formData.vegStarters + formData.nonVegStarters + formData.mainCourse + formData.desserts + formData.drinks) > 0 && (
                  <div className="flex items-center justify-center gap-2 p-3 bg-primary/10 rounded-lg">
                    <ChefHat className="w-4 h-4 text-primary" />
                    <p className="text-sm font-semibold text-primary">
                      Total: {formData.vegStarters + formData.nonVegStarters + formData.mainCourse + formData.desserts + formData.drinks} dishes
                    </p>
                  </div>
                )}
              </div>

              {/* Menu Description */}
              <div className="space-y-2">
                <Label htmlFor="menuDescription" className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4" />
                  Menu Style Notes (Optional)
                </Label>
                <Textarea
                  id="menuDescription"
                  placeholder="Add any style preferences, spice levels, or special requests (e.g., 'medium spicy', 'fusion style', 'traditional only')"
                  value={formData.menuDescription}
                  onChange={(e) => setFormData({ ...formData, menuDescription: e.target.value })}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Optional hints to help the AI generate dishes matching your preferences.
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 hover:scale-105 transition-all shadow-glow-blue"
                disabled={createEvent.isPending}
              >
                {createEvent.isPending ? "Creating Event..." : "Generate Menu →"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-muted-foreground">
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
