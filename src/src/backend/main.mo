import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Char "mo:core/Char";
import Nat64 "mo:core/Nat64";
import Float "mo:core/Float";
import Order "mo:core/Order";
import Migration "migration";

(with migration = Migration.run)
actor {
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
    date : Time.Time;
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

  let events = Map.empty<Nat, Event>();
  var nextId = 0;

  public shared ({ caller }) func createEvent(
    name : Text,
    location : Text,
    date : Time.Time,
    guestCount : Nat,
    adultPercentage : Nat,
    kidPercentage : Nat,
    mealTime : MealTime,
    weather : Weather,
    temperature : Int,
    menuDescription : Text,
    vegStarters : Nat,
    nonVegStarters : Nat,
    mainCourse : Nat,
    desserts : Nat,
    drinks : Nat,
    eventType : EventType,
    cuisinePreference : CuisinePreference,
    dietaryRequirements : [DietaryRequirement],
  ) : async Nat {
    let id = nextId;
    nextId += 1;

    let event : Event = {
      id;
      name;
      location;
      date;
      guestCount;
      adultPercentage;
      kidPercentage;
      eventType;
      cuisinePreference;
      dietaryRequirements;
      mealTime;
      weather;
      temperature;
      menuDescription;
      vegStarters;
      nonVegStarters;
      mainCourse;
      desserts;
      drinks;
      menuSuggestions = [];
      approvedMenu = [];
      batchStrategies = [];
      status = #planned;
      alerts = [];
    };

    events.add(id, event);
    id;
  };

  func selectRandomItems(items : [Text], count : Nat) : [Text] {
    if (items.size() <= count) { return items };

    let selectedIndices = List.empty<Nat>();
    let selectedItems = List.empty<Text>();

    func getRandomIndex() : Nat {
      Int.abs(Time.now() % items.size()).toNat();
    };

    for (i in Nat.range(0, count)) {
      let randomIndex = getRandomIndex();
      if (randomIndex < items.size()) {
        let alreadySelected = selectedIndices.values().any(
          func(index) { index == randomIndex }
        );
        if (not alreadySelected) {
          selectedIndices.add(randomIndex);
          selectedItems.add(items[randomIndex]);
        };
      };
    };

    let resultArray = selectedItems.toArray();
    if (resultArray.size() < count) {
      let needed = count - resultArray.size();
      let remainingItems = items.filter(
        func(item) {
          not resultArray.values().any(func(existing) { existing == item });
        }
      );

      // Manually take needed elements from remainingItems
      let remainingToAddList = List.empty<Text>();
      var addedCount = 0;

      for (item in remainingItems.values()) {
        if (addedCount < needed) {
          remainingToAddList.add(item);
          addedCount += 1;
        };
      };

      let finalItems = remainingToAddList.toArray();
      resultArray.concat(finalItems);
    } else {
      resultArray;
    };
  };

  public shared ({ caller }) func generateMenuSuggestions(eventId : Nat) : async [MenuItem] {
    switch (events.get(eventId)) {
      case (null) { Runtime.trap("Event not found") };
      case (?event) {
        let suggestionsList = List.empty<MenuItem>();

        let vegStarters = [
          "Paneer Tikka",
          "Baby Corn Manchurian",
          "Veg Spring Rolls",
          "Mushroom Pepper Fry",
          "Samosas",
          "Hara Bhara Kabab",
          "Stuffed Mushrooms",
          "Corn Cheese Balls",
        ];
        let nonVegStarters = [
          "Chicken Tikka",
          "Fish Fingers",
          "Prawn Fry",
          "Chicken Wings",
          "Mutton Seekh Kabab",
          "Tandoori Chicken",
          "Chicken 65",
        ];
        let mainCourse = [
          "Paneer Butter Masala",
          "Dal Makhani",
          "Mix Veg Curry",
          "Palak Paneer",
          "Chana Masala",
          "Aloo Gobi",
          "Butter Chicken",
          "Mutton Rogan Josh",
          "Fish Curry",
          "Chicken Biryani",
          "Prawn Masala",
          "Chicken Chettinad",
        ];
        let desserts = [
          "Gulab Jamun",
          "Rasmalai",
          "Kheer",
          "Gajar Halwa",
          "Jalebi",
        ];
        let drinks = [
          "Lassi",
          "Soda",
          "Fruit Juice",
          "Filter Coffee",
          "Mocktails",
          "Green Tea",
        ];

        /// YOU MUST CHANGE THIS. COMMENT IS TEMPORARY WORKAROUND.
        // The estimatedPortions field must be set to 0 here,
        // allowing the frontend to accurately calculate portions
        // based on guest count, category multipliers, and dish count.
        //
        // The hardcoded value causes state sync issues and must not be removed
        //
        // - Multiply guests by category multipliers (0.65 for starters, etc.)
        // - Divide by number of dishes per category to get realistic portions.

        func addRandomMenuItems(itemList : [Text], count : Nat, category : Text) {
          if (count > 0) {
            let randomItems = selectRandomItems(itemList, count);
            for (item in randomItems.values()) {
              let menuItem : MenuItem = {
                category;
                name = item;
                estimatedPortions = 0;
                approvedPortions = null;
                isManuallyEdited = false;
              };
              suggestionsList.add(menuItem);
            };
          };
        };

        addRandomMenuItems(vegStarters, event.vegStarters, "Veg Starter");
        addRandomMenuItems(nonVegStarters, event.nonVegStarters, "Non-Veg Starter");
        addRandomMenuItems(mainCourse, event.mainCourse, "Main Course");
        addRandomMenuItems(desserts, event.desserts, "Dessert");
        addRandomMenuItems(drinks, event.drinks, "Drink");

        let suggestionsArray = suggestionsList.toArray();
        let updatedEvent = { event with menuSuggestions = suggestionsArray };
        events.add(eventId, updatedEvent);

        suggestionsArray;
      };
    };
  };

  public shared ({ caller }) func saveApprovedMenu(eventId : Nat, approvedMenu : [MenuItem]) : async () {
    switch (events.get(eventId)) {
      case (null) { Runtime.trap("Event not found") };
      case (?event) {
        let updatedEvent = {
          event with
          approvedMenu
        };
        events.add(eventId, updatedEvent);
      };
    };
  };

  func calculatePortionMultiplier(category : Text) : Float {
    switch (category) {
      case ("Veg Starter") { 0.65 };
      case ("Non-Veg Starter") { 0.65 };
      case ("Main Course") { 0.85 };
      case ("Dessert") { 0.55 };
      case ("Drink") { 1.3 };
      case (_) { 1.0 };
    };
  };

  func calculateBatchSplitPercentage(_category : Text, batch : Nat) : Float {
    if (batch == 1) { 0.45 } else if (batch == 2) {
      0.35;
    } else {
      0.20;
    };
  };

  func calculateTotalPortions(event : Event, item : MenuItem) : Nat {
    let basePortions = switch (item.approvedPortions) {
      case (null) { item.estimatedPortions };
      case (?approved) { approved };
    };

    let adjustedBase = basePortions * event.guestCount;
    let multiplier = calculatePortionMultiplier(item.category);
    let adjustedMultiplier = multiplier * adjustedBase.toFloat();
    adjustedMultiplier.toInt().toNat();
  };

  func batchSplitPercentage(_category : Text, batch : Nat) : Nat {
    if (batch == 1) { 45 } else if (batch == 2) {
      35;
    } else {
      20;
    };
  };

  func calculateBatchQuantity(total : Nat, percentage : Nat) : Nat {
    (total * percentage) / 100;
  };

  public shared ({ caller }) func calculateBatchStrategies(eventId : Nat) : async [BatchStrategy] {
    switch (events.get(eventId)) {
      case (null) { Runtime.trap("Event not found") };
      case (?event) {
        let batchStrategies = List.empty<BatchStrategy>();

        for (item in event.approvedMenu.values()) {
          let totalPortions = calculateTotalPortions(event, item);

          let batch1 = calculateBatchQuantity(totalPortions, batchSplitPercentage(item.category, 1));
          let batch2 = calculateBatchQuantity(totalPortions, batchSplitPercentage(item.category, 2));
          let batch3 = calculateBatchQuantity(totalPortions, batchSplitPercentage(item.category, 3));
          let category = item.category;
          let name = item.name;

          let batch1StartTime = determineStartTime(category);
          let triggerCondition = "70% consumed";
          let batch2Timing = "When 70% of Batch 1 consumed";
          let adjustmentStrategy = "Adjust based on consumption";
          let riskLevel = determineRiskLevel(category);
          let cookingTimingSuggestion = determineTimingSuggestion(category);
          let riskScore = calculateRiskScore(category);

          let strategy : BatchStrategy = {
            dishName = name;
            dishCategory = category;
            totalPortions;
            batch1Quantity = batch1;
            batch2Quantity = batch2;
            batch3Quantity = batch3;
            batch1StartTime;
            batch2Timing;
            triggerCondition;
            adjustmentStrategy;
            riskLevel;
            riskScore;
            cookingTimingSuggestion;
          };

          batchStrategies.add(strategy);
        };

        let batchStrategiesArray = batchStrategies.toArray();
        let updatedEvent = {
          event with batchStrategies = batchStrategiesArray
        };
        events.add(eventId, updatedEvent);

        batchStrategiesArray;
      };
    };
  };

  func calculateRiskScore(category : Text) : Nat {
    let normalizedCategory = toLowercase(category);

    var score = 0;

    switch (normalizedCategory) {
      case ("dessert") { score += 80 };
      case ("main course") { score += 60 };
      case ("drink") { score += 50 };
      case ("veg starter") { score += 80 };
      case ("non-veg starter") { score += 80 };
      case (_) { score += 50 };
    };

    if (score > 100) { 100 } else { score };
  };

  func toLowercase(input : Text) : Text {
    let chars = input.toArray().map(func(c) { if (c >= 'A' and c <= 'Z') { Char.fromNat32(c.toNat32() + 32) } else { c } });
    Text.fromArray(chars);
  };

  func determineStartTime(category : Text) : Text {
    switch (category) {
      case ("Veg Starter") { "Event start" };
      case ("Non-Veg Starter") { "Event start" };
      case ("Dessert") { "90 minutes after start" };
      case ("Main Course") { "30 minutes after start" };
      case ("Drink") { "No specific timing" };
      case (_) { "No specific timing" };
    };
  };

  func determineRiskLevel(category : Text) : RiskLevel {
    switch (category) {
      case ("Dessert") { #high };
      case ("Veg Starter") { #high };
      case ("Non-Veg Starter") { #high };
      case ("Main Course") { #medium };
      case (_) { #low };
    };
  };

  func determineTimingSuggestion(category : Text) : Text {
    switch (category) {
      case ("Veg Starter") { "Start at event beginning" };
      case ("Non-Veg Starter") { "Start at event beginning" };
      case ("Dessert") { "Serve after main course" };
      case ("Main Course") { "Serve after starters" };
      case ("Drink") { "Serve throughout event" };
      case (_) { "No specific timing" };
    };
  };

  public query ({ caller }) func getEventDashboard(eventId : Nat) : async {
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
  } {
    switch (events.get(eventId)) {
      case (null) { Runtime.trap("Event not found") };
      case (?event) {
        {
          id = event.id;
          name = event.name;
          location = event.location;
          date = event.date;
          guestCount = event.guestCount;
          adultPercentage = event.adultPercentage;
          kidPercentage = event.kidPercentage;
          eventType = event.eventType;
          cuisinePreference = event.cuisinePreference;
          dietaryRequirements = event.dietaryRequirements;
          mealTime = event.mealTime;
          weather = event.weather;
          temperature = event.temperature;
          menuDescription = event.menuDescription;
          vegStarters = event.vegStarters;
          nonVegStarters = event.nonVegStarters;
          mainCourse = event.mainCourse;
          desserts = event.desserts;
          drinks = event.drinks;
          menuSuggestions = event.menuSuggestions;
          approvedMenu = event.approvedMenu;
          batchStrategies = event.batchStrategies;
          status = event.status;
          alerts = event.alerts;
        };
      };
    };
  };

  public query ({ caller }) func listEvents() : async [Event] {
    let eventList = List.fromIter<Event>(events.values());
    let reversedList = eventList.reverse();
    reversedList.toArray();
  };

  public shared ({ caller }) func updateEventStatus(eventId : Nat, status : EventStatus) : async () {
    switch (events.get(eventId)) {
      case (null) { Runtime.trap("Event not found") };
      case (?event) {
        let updatedEvent = { event with status };
        events.add(eventId, updatedEvent);
      };
    };
  };

  public shared ({ caller }) func addAlert(eventId : Nat, alert : Text) : async () {
    switch (events.get(eventId)) {
      case (null) { Runtime.trap("Event not found") };
      case (?event) {
        let newAlerts = event.alerts.concat([alert]);
        let updatedEvent = { event with alerts = newAlerts };
        events.add(eventId, updatedEvent);
      };
    };
  };

  public shared ({ caller }) func adjustBatchQuantities(eventId : Nat, dishName : Text, adjustmentType : Text) : async BatchStrategy {
    switch (events.get(eventId)) {
      case (null) { Runtime.trap("Event not found") };
      case (?event) {
        let batchStrategies = List.fromArray<BatchStrategy>(event.batchStrategies);
        let index = batchStrategies.findIndex(func(strategy) { strategy.dishName == dishName });

        switch (index) {
          case (null) { Runtime.trap("BatchStrategy not found"); };
          case (?idx) {
            let adjustedStrategies = batchStrategies.toArray();
            if (idx >= adjustedStrategies.size()) {
              Runtime.trap("BatchStrategy index out of bounds");
            } else {
              let originalStrategy = adjustedStrategies[idx];
              var newBatch2Quantity = originalStrategy.batch2Quantity;
              var newBatch3Quantity = originalStrategy.batch3Quantity;

              if (adjustmentType == "increase") {
                newBatch2Quantity *= 110;
                newBatch3Quantity *= 110;
              } else if (adjustmentType == "reduce") {
                newBatch2Quantity *= 72;
                newBatch3Quantity *= 72;
              };

              let updatedStrategy = {
                originalStrategy with
                batch2Quantity = newBatch2Quantity;
                batch3Quantity = newBatch3Quantity;
              };

              let newStrategies = List.empty<BatchStrategy>();
              for (i in Nat.range(0, idx)) {
                newStrategies.add(adjustedStrategies[i]);
              };
              newStrategies.add(updatedStrategy);
              for (i in Nat.range(idx + 1, adjustedStrategies.size())) {
                if (i < adjustedStrategies.size()) {
                  newStrategies.add(adjustedStrategies[i]);
                };
              };

              let batchStrategiesArray = newStrategies.toArray();
              let updatedEvent = {
                event with batchStrategies = batchStrategiesArray
              };
              events.add(eventId, updatedEvent);

              updatedStrategy;
            };
          };
        };
      };
    };
  };
};
