import { solveVRP } from "./index";

const depot = {
  id: "depot",
  name: "Depot",
  address: "Main Warehouse",
  latitude: 19.076,
  longitude: 72.8777,
  demand: 0,
  serviceTimeMinutes: 0,
  type: "depot" as const,
};

const customer1 = {
  id: "c1",
  name: "Customer 1",
  address: "Andheri East",
  latitude: 19.1197,
  longitude: 72.8464,
  demand: 10,
  timeWindowStart: "06:00",
  timeWindowEnd: "08:00",
  serviceTimeMinutes: 5,
  type: "customer" as const,
};

const customer2 = {
  id: "c2",
  name: "Customer 2",
  address: "Bandra West",
  latitude: 19.0596,
  longitude: 72.8295,
  demand: 15,
  timeWindowStart: "06:30",
  timeWindowEnd: "08:30",
  serviceTimeMinutes: 5,
  type: "customer" as const,
};

const vehicle = {
  id: "v1",
  driverId: "d1",
  driverName: "Rajesh",
  driverPhone: "919876543210",
  capacityKg: 100,
  capacityL: 200,
  startLocation: depot,
  endLocation: depot,
  maxDistanceKm: 50,
  maxDurationMinutes: 480,
  vehicleType: "van" as const,
  fixedCost: 0,
  costPerKm: 15,
  costPerMinute: 1,
};

const request = {
  locations: [depot, customer1, customer2],
  vehicles: [vehicle],
  options: {
    optimizationGoal: "balanced" as const,
    considerTraffic: true,
    trafficFactor: 1.3,
    allowSplitDeliveries: false,
    timeLimitSeconds: 30,
  },
};

const result = solveVRP(request);
console.log("Routes:", result.routes.length);
console.log("Locations served:", result.summary.locationsServed);
console.log("Unassigned:", result.unassignedLocations.length);
console.log("Routes detail:", JSON.stringify(result.routes, null, 2));
