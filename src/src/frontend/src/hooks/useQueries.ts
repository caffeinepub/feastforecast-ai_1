import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import type { Event, MenuItem, MealTime, Weather, EventStatus, EventType, CuisinePreference, DietaryRequirement } from "../backend";

export function useListEvents() {
  const { actor, isFetching } = useActor();
  return useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listEvents();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      location: string;
      date: bigint;
      guestCount: bigint;
      adultPercentage: bigint;
      kidPercentage: bigint;
      mealTime: MealTime;
      weather: Weather;
      temperature: bigint;
      menuDescription: string;
      vegStarters: bigint;
      nonVegStarters: bigint;
      mainCourse: bigint;
      desserts: bigint;
      drinks: bigint;
      eventType: EventType;
      cuisinePreference: CuisinePreference;
      dietaryRequirements: DietaryRequirement[];
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.createEvent(
        params.name,
        params.location,
        params.date,
        params.guestCount,
        params.adultPercentage,
        params.kidPercentage,
        params.mealTime,
        params.weather,
        params.temperature,
        params.menuDescription,
        params.vegStarters,
        params.nonVegStarters,
        params.mainCourse,
        params.desserts,
        params.drinks,
        params.eventType,
        params.cuisinePreference,
        params.dietaryRequirements
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useGenerateMenuSuggestions(eventId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<MenuItem[]>({
    queryKey: ["menuSuggestions", eventId?.toString()],
    queryFn: async () => {
      if (!actor || !eventId) return [];
      return actor.generateMenuSuggestions(eventId);
    },
    enabled: !!actor && !isFetching && eventId !== null,
  });
}

export function useSaveApprovedMenu() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      eventId: bigint;
      approvedMenu: MenuItem[];
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.saveApprovedMenu(params.eventId, params.approvedMenu);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["event", variables.eventId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["menuSuggestions", variables.eventId.toString()],
      });
    },
  });
}

export function useGetEventDashboard(eventId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Event>({
    queryKey: ["event", eventId?.toString()],
    queryFn: async () => {
      if (!actor || !eventId) throw new Error("Event ID required");
      return actor.getEventDashboard(eventId);
    },
    enabled: !!actor && !isFetching && eventId !== null,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  });
}

export function useUpdateEventStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { eventId: bigint; status: EventStatus }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.updateEventStatus(params.eventId, params.status);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["event", variables.eventId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["kitchen", variables.eventId.toString()],
      });
    },
  });
}

export function useCalculateBatchStrategies() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: bigint) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.calculateBatchStrategies(eventId);
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({
        queryKey: ["event", eventId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["batchStrategies", eventId.toString()],
      });
    },
  });
}

export function useAdjustBatchQuantities() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      eventId: bigint;
      dishName: string;
      adjustmentType: string;
    }) => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.adjustBatchQuantities(params.eventId, params.dishName, params.adjustmentType);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["event", variables.eventId.toString()],
      });
    },
  });
}
