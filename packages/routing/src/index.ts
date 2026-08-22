import { z } from "zod";

export const LocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  demand: z.number().default(0), // kg or volume
  timeWindowStart: z.string().optional(), // HH:MM format
  timeWindowEnd: z.string().optional(),
  serviceTimeMinutes: z.number().default(5),
  type: z.enum(["depot", "customer", "driver_home"]).default("customer"),
});

export type Location = z.infer<typeof LocationSchema>;

export const VehicleSchema = z.object({
  id: z.string(),
  driverId: z.string(),
  driverName: z.string(),
  driverPhone: z.string(),
  capacityKg: z.number(),
  capacityL: z.number(),
  startLocation: LocationSchema,
  endLocation: LocationSchema.optional(),
  maxDistanceKm: z.number().default(100),
  maxDurationMinutes: z.number().default(480), // 8 hours
  vehicleType: z.enum(["bike", "auto", "van", "truck"]),
  fixedCost: z.number().default(0),
  costPerKm: z.number().default(10),
  costPerMinute: z.number().default(1),
});

export type Vehicle = z.infer<typeof VehicleSchema>;

export const RouteRequestSchema = z.object({
  locations: z.array(LocationSchema).min(2),
  vehicles: z.array(VehicleSchema).min(1),
  options: z
    .object({
      optimizationGoal: z.enum(["min_distance", "min_time", "min_vehicles", "balanced"]).default("balanced"),
      considerTraffic: z.boolean().default(true),
      trafficFactor: z.number().default(1.3), // Indian traffic multiplier
      allowSplitDeliveries: z.boolean().default(false),
      maxRoutes: z.number().optional(),
      timeLimitSeconds: z.number().default(30),
    })
    .default({}),
});

export type RouteRequest = z.infer<typeof RouteRequestSchema>;

export const RouteStopSchema = z.object({
  locationId: z.string(),
  locationName: z.string(),
  sequence: z.number(),
  arrivalTime: z.string(), // HH:MM
  departureTime: z.string(), // HH:MM
  distanceFromPreviousKm: z.number(),
  durationFromPreviousMin: z.number(),
  cumulativeDistanceKm: z.number(),
  cumulativeDurationMin: z.number(),
  loadKg: z.number(),
  loadL: z.number(),
});

export type RouteStop = z.infer<typeof RouteStopSchema>;

export const OptimizedRouteSchema = z.object({
  vehicleId: z.string(),
  driverId: z.string(),
  driverName: z.string(),
  driverPhone: z.string(),
  stops: z.array(RouteStopSchema),
  totalDistanceKm: z.number(),
  totalDurationMin: z.number(),
  totalLoadKg: z.number(),
  totalLoadL: z.number(),
  utilizationPct: z.number(),
  cost: z.number(),
  polyline: z.string().optional(), // encoded polyline for map display
});

export type OptimizedRoute = z.infer<typeof OptimizedRouteSchema>;

export const RouteResponseSchema = z.object({
  routes: z.array(OptimizedRouteSchema),
  unassignedLocations: z.array(LocationSchema),
  summary: z.object({
    totalDistanceKm: z.number(),
    totalDurationMin: z.number(),
    totalCost: z.number(),
    vehiclesUsed: z.number(),
    locationsServed: z.number(),
    locationsUnassigned: z.number(),
  }),
  metadata: z.object({
    computationTimeMs: z.number(),
    algorithm: z.string(),
    timestamp: z.string(),
  }),
});

export type RouteResponse = z.infer<typeof RouteResponseSchema>;

// Indian road network approximations
const INDIAN_ROAD_FACTORS = {
  highway: 1.0,
  arterial: 1.15,
  local: 1.35,
  narrow_lane: 1.6,
  unpaved: 2.0,
};

const VEHICLE_SPEED_KMPH = {
  bike: 25,
  auto: 20,
  van: 18,
  truck: 15,
};

const VEHICLE_COST_PER_KM = {
  bike: 3,
  auto: 8,
  van: 15,
  truck: 25,
};

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function estimateTravelTime(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  vehicleType: Vehicle["vehicleType"],
  trafficFactor: number
): number {
  const distance = haversineDistance(lat1, lon1, lat2, lon2);
  const baseSpeed = VEHICLE_SPEED_KMPH[vehicleType];
  const roadFactor = INDIAN_ROAD_FACTORS.local; // Default to local roads
  const timeHours = (distance * roadFactor * trafficFactor) / baseSpeed;
  return Math.round(timeHours * 60); // minutes
}

function estimateTravelDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  trafficFactor: number
): number {
  const distance = haversineDistance(lat1, lon1, lat2, lon2);
  return Math.round(distance * INDIAN_ROAD_FACTORS.local * trafficFactor * 100) / 100; // km
}

function formatTime(minutesFromMidnight: number): string {
  const hours = Math.floor(minutesFromMidnight / 60);
  const mins = minutesFromMidnight % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

function parseTimeWindow(timeStr: string): { start: number; end: number } | null {
  if (!timeStr) return null;
  const [start, end] = timeStr.split("-").map((t) => t.trim());
  const parse = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  return { start: parse(start), end: parse(end) };
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

// Simple Clarke-Wright Savings Algorithm with Indian constraints
export function solveVRP(request: RouteRequest): RouteResponse {
  const startTime = Date.now();
  const { locations, vehicles, options } = request;

  const depot = locations.find((l) => l.type === "depot") || locations[0];
  const customers = locations.filter((l) => l.type === "customer");
  const driverHomes = locations.filter((l) => l.type === "driver_home");

  // Build distance/time matrix
  const n = locations.length;
  const distanceMatrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  const timeMatrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        distanceMatrix[i][j] = estimateTravelDistance(
          locations[i].latitude,
          locations[i].longitude,
          locations[j].latitude,
          locations[j].longitude,
          options.trafficFactor
        );
        // Use first vehicle type for matrix (approximation)
        timeMatrix[i][j] = estimateTravelTime(
          locations[i].latitude,
          locations[i].longitude,
          locations[j].latitude,
          locations[j].longitude,
          vehicles[0].vehicleType,
          options.trafficFactor
        );
      }
    }
  }

  // Simple greedy assignment for now - assign customers to nearest vehicle
  // that has capacity and time window feasibility
  const routes: OptimizedRoute[] = [];
  const assigned = new Set<string>();
  const unassigned: Location[] = [];

  for (const vehicle of vehicles) {
    if (options.maxRoutes && routes.length >= options.maxRoutes) break;

    const routeStops: RouteStop[] = [];
    let currentLoadKg = 0;
    let currentLoadL = 0;
    let currentTime = timeToMinutes("06:00"); // Start at 6 AM
    let currentLocationIdx = locations.findIndex((l) => l.id === vehicle.startLocation.id);
    let totalDistance = 0;
    let totalDuration = 0;
    let sequence = 0;

    // Add depot as first stop
    routeStops.push({
      locationId: vehicle.startLocation.id,
      locationName: vehicle.startLocation.name,
      sequence: sequence++,
      arrivalTime: formatTime(currentTime),
      departureTime: formatTime(currentTime),
      distanceFromPreviousKm: 0,
      durationFromPreviousMin: 0,
      cumulativeDistanceKm: 0,
      cumulativeDurationMin: 0,
      loadKg: 0,
      loadL: 0,
    });

    // Sort customers by distance from vehicle start
    const availableCustomers = customers
      .filter((c) => !assigned.has(c.id))
      .sort((a, b) => {
        const idxA = locations.findIndex((l) => l.id === a.id);
        const idxB = locations.findIndex((l) => l.id === b.id);
        return distanceMatrix[currentLocationIdx][idxA] - distanceMatrix[currentLocationIdx][idxB];
      });

    for (const customer of availableCustomers) {
      const customerIdx = locations.findIndex((l) => l.id === customer.id);

      // Check capacity
      if (currentLoadKg + customer.demand > vehicle.capacityKg) continue;

      // Check time window
      const travelTime = timeMatrix[currentLocationIdx][customerIdx];
      const arrivalTime = currentTime + travelTime;
      const timeWindow = parseTimeWindow(`${customer.timeWindowStart || "06:00"}-${customer.timeWindowEnd || "22:00"}`);

      if (timeWindow && (arrivalTime < timeWindow.start || arrivalTime > timeWindow.end)) {
        // Try to wait
        const waitTime = timeWindow.start > arrivalTime ? timeWindow.start - arrivalTime : 0;
        if (waitTime > 60) continue; // Don't wait more than 1 hour
      }

      // Check max duration
      const returnTime = timeMatrix[customerIdx][currentLocationIdx];
      if (currentTime + travelTime + customer.serviceTimeMinutes + returnTime > vehicle.maxDurationMinutes) continue;

      // Check max distance
      const travelDistance = distanceMatrix[currentLocationIdx][customerIdx];
      const returnDistance = distanceMatrix[customerIdx][currentLocationIdx];
      if (totalDistance + travelDistance + returnDistance > vehicle.maxDistanceKm) continue;

      // Assign customer
      assigned.add(customer.id);
      const departureTime = arrivalTime + customer.serviceTimeMinutes;

      routeStops.push({
        locationId: customer.id,
        locationName: customer.name,
        sequence: sequence++,
        arrivalTime: formatTime(arrivalTime),
        departureTime: formatTime(departureTime),
        distanceFromPreviousKm: travelDistance,
        durationFromPreviousMin: travelTime,
        cumulativeDistanceKm: totalDistance + travelDistance,
        cumulativeDurationMin: departureTime - timeToMinutes("06:00"),
        loadKg: currentLoadKg + customer.demand,
        loadL: currentLoadL, // Simplified
      });

      currentLoadKg += customer.demand;
      currentTime = departureTime;
      currentLocationIdx = customerIdx;
      totalDistance += travelDistance;
      totalDuration = currentTime - timeToMinutes("06:00");
    }

    // Return to depot/end location
    const endLocation = vehicle.endLocation || vehicle.startLocation;
    const endIdx = locations.findIndex((l) => l.id === endLocation.id);
    const returnTime = timeMatrix[currentLocationIdx][endIdx];
    const returnDistance = distanceMatrix[currentLocationIdx][endIdx];

    routeStops.push({
      locationId: endLocation.id,
      locationName: endLocation.name,
      sequence: sequence++,
      arrivalTime: formatTime(currentTime + returnTime),
      departureTime: formatTime(currentTime + returnTime),
      distanceFromPreviousKm: returnDistance,
      durationFromPreviousMin: returnTime,
      cumulativeDistanceKm: totalDistance + returnDistance,
      cumulativeDurationMin: totalDuration + returnTime,
      loadKg: 0,
      loadL: 0,
    });

    totalDistance += returnDistance;
    totalDuration += returnTime;

    if (routeStops.length > 2) {
      // Has at least one customer
      routes.push({
        vehicleId: vehicle.id,
        driverId: vehicle.driverId,
        driverName: vehicle.driverName,
        driverPhone: vehicle.driverPhone,
        stops: routeStops,
        totalDistanceKm: Math.round(totalDistance * 100) / 100,
        totalDurationMin: totalDuration,
        totalLoadKg: currentLoadKg,
        totalLoadL: currentLoadL,
        utilizationPct: Math.round((currentLoadKg / vehicle.capacityKg) * 100),
        cost: Math.round(totalDistance * VEHICLE_COST_PER_KM[vehicle.vehicleType] + totalDuration * vehicle.costPerMinute),
        polyline: encodePolyline(routeStops.map((s) => locations.find((l) => l.id === s.locationId)!)),
      });
    }
  }

  // Collect unassigned
  for (const customer of customers) {
    if (!assigned.has(customer.id)) {
      unassigned.push(customer);
    }
  }

  const summary = {
    totalDistanceKm: Math.round(routes.reduce((sum, r) => sum + r.totalDistanceKm, 0) * 100) / 100,
    totalDurationMin: routes.reduce((sum, r) => sum + r.totalDurationMin, 0),
    totalCost: routes.reduce((sum, r) => sum + r.cost, 0),
    vehiclesUsed: routes.length,
    locationsServed: assigned.size,
    locationsUnassigned: unassigned.length,
  };

  return {
    routes: routes as OptimizedRoute[],
    unassignedLocations: unassigned,
    summary,
    metadata: {
      computationTimeMs: Date.now() - startTime,
      algorithm: "clarke-wright-greedy-indian",
      timestamp: new Date().toISOString(),
    },
  };
}

function encodePolyline(locations: Location[]): string {
  // Simplified polyline encoding - in production use @googlemaps/polyline-codec
  return locations
    .map((l) => `${l.latitude.toFixed(6)},${l.longitude.toFixed(6)}`)
    .join("|");
}

// Helper to create route request from orders
export function createRouteRequestFromOrders(
  orders: Array<{
    id: string;
    customerName: string;
    address: string;
    latitude: number;
    longitude: number;
    weightKg: number;
    timeWindowStart?: string;
    timeWindowEnd?: string;
  }>,
  drivers: Array<{
    id: string;
    name: string;
    phone: string;
    vehicleType: "bike" | "auto" | "van" | "truck";
    capacityKg: number;
    homeLat: number;
    homeLng: number;
  }>,
  depot: { name: string; address: string; latitude: number; longitude: number }
): RouteRequest {
  const locations: Location[] = [
    {
      id: "depot",
      name: depot.name,
      address: depot.address,
      latitude: depot.latitude,
      longitude: depot.longitude,
      demand: 0,
      serviceTimeMinutes: 0,
      type: "depot",
    },
  ];

  for (const order of orders) {
    locations.push({
      id: order.id,
      name: order.customerName,
      address: order.address,
      latitude: order.latitude,
      longitude: order.longitude,
      demand: order.weightKg,
      timeWindowStart: order.timeWindowStart,
      timeWindowEnd: order.timeWindowEnd,
      serviceTimeMinutes: 5,
      type: "customer",
    });
  }

  const vehicles: Vehicle[] = drivers.map((driver) => ({
    id: `vehicle-${driver.id}`,
    driverId: driver.id,
    driverName: driver.name,
    driverPhone: driver.phone,
    capacityKg: driver.capacityKg,
    capacityL: driver.capacityKg * 2, // rough volume estimate
    startLocation: {
      id: `driver-home-${driver.id}`,
      name: `${driver.name}'s Home`,
      address: "Driver Home",
      latitude: driver.homeLat,
      longitude: driver.homeLng,
      demand: 0,
      serviceTimeMinutes: 0,
      type: "driver_home",
    },
    endLocation: {
      id: `driver-home-${driver.id}`,
      name: `${driver.name}'s Home`,
      address: "Driver Home",
      latitude: driver.homeLat,
      longitude: driver.homeLng,
      demand: 0,
      serviceTimeMinutes: 0,
      type: "driver_home",
    },
    maxDistanceKm: 80,
    maxDurationMinutes: 480,
    vehicleType: driver.vehicleType,
    fixedCost: 0,
    costPerKm: VEHICLE_COST_PER_KM[driver.vehicleType],
    costPerMinute: 1,
  }));

  return {
    locations,
    vehicles,
    options: {
      optimizationGoal: "balanced",
      considerTraffic: true,
      trafficFactor: 1.3,
      allowSplitDeliveries: false,
      timeLimitSeconds: 30,
    },
  };
}