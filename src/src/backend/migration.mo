import Nat "mo:core/Nat";
import Map "mo:core/Map";

module {
  public type Weather = {
    #sunny;
    #cloudy;
    #rainy;
  };

  public type MealTime = {
    #lunch;
    #dinner;
  };

  public type EventStatus = {
    #planned;
    #cooking;
    #completed;
  };

  public type RiskLevel = {
    #high;
    #medium;
    #low;
  };

  public type EventType = {
    #wedding;
    #corporate;
    #schoolFunction;
    #birthday;
  };

  public type CuisinePreference = {
    #northIndian;
    #southIndian;
    #chinese;
    #continental;
  };

  public type DietaryRequirement = {
    #jain;
    #vegan;
    #glutenFree;
  };

  public type MenuItem = {
    category : Text;
    name : Text;
    estimatedPortions : Nat;
    approvedPortions : ?Nat;
    isManuallyEdited : Bool;
  };

  public type BatchStrategy = {
    dishName : Text;
    dishCategory : Text;
    totalPortions : Nat;
    batch1Quantity : Nat;
    batch2Quantity : Nat;
    batch3Quantity : Nat;
    batch1StartTime : Text;
    batch2Timing : Text;
    triggerCondition : Text;
    adjustmentStrategy : Text;
    riskLevel : RiskLevel;
    riskScore : Nat;
    cookingTimingSuggestion : Text;
  };

  public type Event = {
    id : Nat;
    name : Text;
    location : Text;
    date : Int;
    guestCount : Nat;
    adultPercentage : Nat;
    kidPercentage : Nat;
    eventType : EventType;
    cuisinePreference : CuisinePreference;
    dietaryRequirements : [DietaryRequirement];
    mealTime : MealTime;
    weather : Weather;
    temperature : Int;
    menuDescription : Text;
    vegStarters : Nat;
    nonVegStarters : Nat;
    mainCourse : Nat;
    desserts : Nat;
    drinks : Nat;
    menuSuggestions : [MenuItem];
    approvedMenu : [MenuItem];
    batchStrategies : [BatchStrategy];
    status : EventStatus;
    alerts : [Text];
  };

  type OldActor = {
    events : Map.Map<Nat, Event>;
    nextId : Nat;
  };

  type NewActor = {
    events : Map.Map<Nat, Event>;
    nextId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    old;
  };
};
