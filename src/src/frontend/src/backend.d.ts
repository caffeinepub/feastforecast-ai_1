import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MenuItem {
    name: string;
    estimatedPortions: bigint;
    approvedPortions?: bigint;
    category: string;
    isManuallyEdited: boolean;
}
export type Time = bigint;
export interface Event {
    id: bigint;
    status: EventStatus;
    dietaryRequirements: Array<DietaryRequirement>;
    mainCourse: bigint;
    batchStrategies: Array<BatchStrategy>;
    desserts: bigint;
    alerts: Array<string>;
    temperature: bigint;
    vegStarters: bigint;
    date: Time;
    menuSuggestions: Array<MenuItem>;
    guestCount: bigint;
    nonVegStarters: bigint;
    name: string;
    kidPercentage: bigint;
    cuisinePreference: CuisinePreference;
    adultPercentage: bigint;
    approvedMenu: Array<MenuItem>;
    menuDescription: string;
    weather: Weather;
    drinks: bigint;
    location: string;
    mealTime: MealTime;
    eventType: EventType;
}
export interface BatchStrategy {
    triggerCondition: string;
    dishCategory: string;
    batch3Quantity: bigint;
    batch2Timing: string;
    batch2Quantity: bigint;
    dishName: string;
    batch1Quantity: bigint;
    batch1StartTime: string;
    cookingTimingSuggestion: string;
    riskLevel: RiskLevel;
    riskScore: bigint;
    totalPortions: bigint;
    adjustmentStrategy: string;
}
export enum CuisinePreference {
    continental = "continental",
    southIndian = "southIndian",
    northIndian = "northIndian",
    chinese = "chinese"
}
export enum DietaryRequirement {
    vegan = "vegan",
    glutenFree = "glutenFree",
    jain = "jain"
}
export enum EventStatus {
    completed = "completed",
    planned = "planned",
    cooking = "cooking"
}
export enum EventType {
    schoolFunction = "schoolFunction",
    wedding = "wedding",
    birthday = "birthday",
    corporate = "corporate"
}
export enum MealTime {
    lunch = "lunch",
    dinner = "dinner"
}
export enum RiskLevel {
    low = "low",
    high = "high",
    medium = "medium"
}
export enum Weather {
    cloudy = "cloudy",
    sunny = "sunny",
    rainy = "rainy"
}
export interface backendInterface {
    addAlert(eventId: bigint, alert: string): Promise<void>;
    adjustBatchQuantities(eventId: bigint, dishName: string, adjustmentType: string): Promise<BatchStrategy>;
    calculateBatchStrategies(eventId: bigint): Promise<Array<BatchStrategy>>;
    createEvent(name: string, location: string, date: Time, guestCount: bigint, adultPercentage: bigint, kidPercentage: bigint, mealTime: MealTime, weather: Weather, temperature: bigint, menuDescription: string, vegStarters: bigint, nonVegStarters: bigint, mainCourse: bigint, desserts: bigint, drinks: bigint, eventType: EventType, cuisinePreference: CuisinePreference, dietaryRequirements: Array<DietaryRequirement>): Promise<bigint>;
    generateMenuSuggestions(eventId: bigint): Promise<Array<MenuItem>>;
    getEventDashboard(eventId: bigint): Promise<{
        id: bigint;
        status: EventStatus;
        dietaryRequirements: Array<DietaryRequirement>;
        mainCourse: bigint;
        batchStrategies: Array<BatchStrategy>;
        desserts: bigint;
        alerts: Array<string>;
        temperature: bigint;
        vegStarters: bigint;
        date: bigint;
        menuSuggestions: Array<MenuItem>;
        guestCount: bigint;
        nonVegStarters: bigint;
        name: string;
        kidPercentage: bigint;
        cuisinePreference: CuisinePreference;
        adultPercentage: bigint;
        approvedMenu: Array<MenuItem>;
        menuDescription: string;
        weather: Weather;
        drinks: bigint;
        location: string;
        mealTime: MealTime;
        eventType: EventType;
    }>;
    listEvents(): Promise<Array<Event>>;
    saveApprovedMenu(eventId: bigint, approvedMenu: Array<MenuItem>): Promise<void>;
    updateEventStatus(eventId: bigint, status: EventStatus): Promise<void>;
}
