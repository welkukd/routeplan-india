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

// Clarke-Wright Savings Algorithm with Indian constraints
export function solveVRP(request: RouteRequest): RouteResponse {
  const startTime = Date.now();
  const { locations, vehicles, options } = request;

  const depot = locations.find((l) => l.type === "depot") || locations[0];
  const customers = locations.filter((l) => l.type === "customer");
  const driverHomes = locations.filter((l) => l.type === "driver_home");

  // Build distance/time matrix for all locations
  const n = locations.length;
  const locationIndex = new Map(locations.map((l, i) => [l.id, i]));

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

  const depotIdx = locationIndex.get(depot.id)!;
  const routes: OptimizedRoute[] = [];
  const assigned = new Set<string>();

  console.log("DEBUG: locations:", locations.map(l => l.id));
  console.log("DEBUG: customers:", customers.map(c => c.id));
  console.log("DEBUG: depotIdx:", depotIdx);
  console.log("DEBUG: locationIndex:", Array.from(locationIndex.entries()));
  console.log("DEBUG: distanceMatrix:", distanceMatrix);
  console.log("DEBUG: timeMatrix:", timeMatrix);

  // Sort vehicles by capacity (largest first) for min_vehicles goal
  const sortedVehicles = [...vehicles].sort((a, b) => {
    if (options.optimizationGoal === "min_vehicles") return b.capacityKg - a.capacityKg;
    return 0;
  });

  console.log("DEBUG: sortedVehicles:", sortedVehicles.map(v => v.id));

  for (const vehicle of sortedVehicles) {
    console.log("DEBUG: Processing vehicle:", vehicle.id);
    if (options.maxRoutes && routes.length >= options.maxRoutes) break;

    const vehicleRoutes = solveVehicleRoute(
      vehicle,
      customers,
      locations,
      locationIndex,
      distanceMatrix,
      timeMatrix,
      depotIdx,
      options,
      assigned
    );

    console.log("DEBUG: vehicleRoutes returned:", vehicleRoutes.length, "routes");
    vehicleRoutes.forEach((r, i) => console.log(`  Route ${i}:`, r.stops.map(s => s.locationId)));

    if (vehicleRoutes.length > 0) {
      routes.push(...vehicleRoutes);
    }
  }

  console.log("DEBUG: routes after vehicle loop:", routes.length);
  routes.forEach((r, i) => console.log(`  Route ${i}:`, r.stops.map(s => s.locationId)));

  // Collect unassigned customers
  const unassigned: Location[] = [];
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
      algorithm: "clarke-wright-savings-indian",
      timestamp: new Date().toISOString(),
    },
  };
}

interface VehicleRoutePlan {
  stops: RouteStop[];
  totalDistance: number;
  totalDuration: number;
  totalLoadKg: number;
  currentTime: number; // Time after returning to depot (full route)
  lastCustomerTime: number; // Time after last customer (before return)
  currentLocationIdx: number; // Current location (depot after full route)
  lastCustomerIdx: number; // Last customer's location index
}

function solveVehicleRoute(
  vehicle: Vehicle,
  customers: Location[],
  locations: Location[],
  locationIndex: Map<string, number>,
  distanceMatrix: number[][],
  timeMatrix: number[][],
  depotIdx: number,
  options: RouteRequest["options"],
  assigned: Set<string>
): OptimizedRoute[] {
  const vehicleRoutes: OptimizedRoute[] = [];
  const startTime = timeToMinutes("06:00"); // Start at 6 AM

  // Initialize each customer as their own route (depot -> customer -> depot)
  const customerRoutes: Map<string, VehicleRoutePlan> = new Map();

  console.log("DEBUG solveVehicleRoute: vehicle:", vehicle.id, "customers:", customers.map(c => c.id));

  for (const customer of customers) {
    if (assigned.has(customer.id)) continue;

    const customerIdx = locationIndex.get(customer.id)!;
    const toCustomerDist = distanceMatrix[depotIdx][customerIdx];
    const toCustomerTime = timeMatrix[depotIdx][customerIdx];
    const returnDist = distanceMatrix[customerIdx][depotIdx];
    const returnTime = timeMatrix[customerIdx][depotIdx];

    // Check constraints for single customer route
    if (customer.demand > vehicle.capacityKg) { console.log(`DEBUG: ${customer.id} FAIL demand`); continue; }
    if (toCustomerDist + returnDist > vehicle.maxDistanceKm) { console.log(`DEBUG: ${customer.id} FAIL distance`); continue; }
    if (toCustomerTime + customer.serviceTimeMinutes + returnTime > vehicle.maxDurationMinutes) { console.log(`DEBUG: ${customer.id} FAIL duration`); continue; }

    // Check time window
    const timeWindow = parseTimeWindow(`${customer.timeWindowStart || "06:00"}-${customer.timeWindowEnd || "22:00"}`);
    const arrivalTime = startTime + toCustomerTime;
    if (timeWindow && (arrivalTime < timeWindow.start || arrivalTime > timeWindow.end)) {
      const waitTime = timeWindow.start > arrivalTime ? timeWindow.start - arrivalTime : 0;
      if (waitTime > 60) { console.log(`DEBUG: ${customer.id} FAIL time window wait ${waitTime}`); continue; }
    }

    console.log(`DEBUG: ${customer.id} PASSED constraints, arrivalTime: ${arrivalTime}`);

    const routeStops: RouteStop[] = [
      {
        locationId: vehicle.startLocation.id,
        locationName: vehicle.startLocation.name,
        sequence: 0,
        arrivalTime: formatTime(startTime),
        departureTime: formatTime(startTime),
        distanceFromPreviousKm: 0,
        durationFromPreviousMin: 0,
        cumulativeDistanceKm: 0,
        cumulativeDurationMin: 0,
        loadKg: 0,
        loadL: 0,
      },
      {
        locationId: customer.id,
        locationName: customer.name,
        sequence: 1,
        arrivalTime: formatTime(arrivalTime),
        departureTime: formatTime(arrivalTime + customer.serviceTimeMinutes),
        distanceFromPreviousKm: toCustomerDist,
        durationFromPreviousMin: toCustomerTime,
        cumulativeDistanceKm: toCustomerDist,
        cumulativeDurationMin: toCustomerTime + customer.serviceTimeMinutes,
        loadKg: customer.demand,
        loadL: 0,
      },
      {
        locationId: vehicle.endLocation?.id || vehicle.startLocation.id,
        locationName: vehicle.endLocation?.name || vehicle.startLocation.name,
        sequence: 2,
        arrivalTime: formatTime(arrivalTime + customer.serviceTimeMinutes + returnTime),
        departureTime: formatTime(arrivalTime + customer.serviceTimeMinutes + returnTime),
        distanceFromPreviousKm: returnDist,
        durationFromPreviousMin: returnTime,
        cumulativeDistanceKm: toCustomerDist + returnDist,
        cumulativeDurationMin: toCustomerTime + customer.serviceTimeMinutes + returnTime,
        loadKg: 0,
        loadL: 0,
      },
    ];

    customerRoutes.set(customer.id, {
      stops: routeStops,
      totalDistance: toCustomerDist + returnDist,
      totalDuration: toCustomerTime + customer.serviceTimeMinutes + returnTime,
      totalLoadKg: customer.demand,
      currentTime: startTime + toCustomerTime + customer.serviceTimeMinutes + returnTime,
      lastCustomerTime: startTime + toCustomerTime + customer.serviceTimeMinutes,
      currentLocationIdx: depotIdx,
      lastCustomerIdx: customerIdx,
    });
  }

  // Calculate savings for merging routes
  const savings: Array<{ customerA: string; customerB: string; saving: number }> = [];

  const customerIds = Array.from(customerRoutes.keys());
  for (let i = 0; i < customerIds.length; i++) {
    for (let j = i + 1; j < customerIds.length; j++) {
      const idA = customerIds[i];
      const idB = customerIds[j];
      const idxA = locationIndex.get(idA)!;
      const idxB = locationIndex.get(idB)!;

      const distA = distanceMatrix[depotIdx][idxA];
      const distB = distanceMatrix[depotIdx][idxB];
      const distAB = distanceMatrix[idxA][idxB];

      // Clarke-Wright saving: s = d(i,0) + d(0,j) - d(i,j)
      const saving = distA + distB - distAB;

      if (saving > 0) {
        savings.push({ customerA: idA, customerB: idB, saving });
      }
    }
  }

  // Sort savings descending
  savings.sort((a, b) => b.saving - a.saving);

  // Try to merge routes based on savings
  const routes = new Map<string, VehicleRoutePlan>();
  for (const [id, plan] of customerRoutes) {
    routes.set(id, plan);
  }

  for (const { customerA, customerB } of savings) {
    if (routes.size <= 1) break; // Can't merge further

    const routeA = routes.get(customerA);
    const routeB = routes.get(customerB);

    if (!routeA || !routeB || routeA === routeB) continue;

    // Try to merge routeB into routeA (append B after A)
    const merged = tryMergeRoutes(routeA, routeB, customerA, customerB, vehicle, locations, locationIndex, distanceMatrix, timeMatrix, options);
    if (merged) {
      routes.delete(customerB);
      routes.set(customerA, merged);
    }
  }

  // Convert remaining routes to OptimizedRoute format
  for (const [customerId, plan] of Array.from(routes.entries())) {
    if (plan.stops.length <= 2) continue; // Only depot -> depot (no customers)

    // Mark all customers in this route as assigned
    for (const stop of plan.stops) {
      const loc = locations.find((l) => l.id === stop.locationId);
      if (loc?.type === "customer") {
        assigned.add(stop.locationId);
      }
    }

    const endLocation = vehicle.endLocation || vehicle.startLocation;
    const polyline = encodePolyline(
      plan.stops
        .map((s) => locations.find((l) => l.id === s.locationId))
        .filter((l): l is Location => l !== undefined)
    );

    vehicleRoutes.push({
      vehicleId: vehicle.id,
      driverId: vehicle.driverId,
      driverName: vehicle.driverName,
      driverPhone: vehicle.driverPhone,
      stops: plan.stops,
      totalDistanceKm: Math.round(plan.totalDistance * 100) / 100,
      totalDurationMin: plan.totalDuration,
      totalLoadKg: plan.totalLoadKg,
      totalLoadL: 0, // Simplified
      utilizationPct: Math.round((plan.totalLoadKg / vehicle.capacityKg) * 100),
      cost: Math.round(plan.totalDistance * VEHICLE_COST_PER_KM[vehicle.vehicleType] + plan.totalDuration * vehicle.costPerMinute),
      polyline,
    });
  }

  return vehicleRoutes;
}

function tryMergeRoutes(
  routeA: VehicleRoutePlan,
  routeB: VehicleRoutePlan,
  customerA: string,
  customerB: string,
  vehicle: Vehicle,
  locations: Location[],
  locationIndex: Map<string, number>,
  distanceMatrix: number[][],
  timeMatrix: number[][],
  options: RouteRequest["options"]
): VehicleRoutePlan | null {
  // Find the customer stops in each route (excluding depot start/end)
  const stopsA = routeA.stops.filter((s) => {
    const loc = locations.find((l) => l.id === s.locationId);
    return loc?.type === "customer";
  });
  const stopsB = routeB.stops.filter((s) => {
    const loc = locations.find((l) => l.id === s.locationId);
    return loc?.type === "customer";
  });

  if (stopsA.length === 0 || stopsB.length === 0) return null;

  const lastCustomerA = stopsA[stopsA.length - 1];
  const firstCustomerB = stopsB[0];

  const idxA = routeA.lastCustomerIdx;
  const idxB = routeB.lastCustomerIdx;
  const depotIdx = locationIndex.get(locations.find((l) => l.type === "depot")!.id)!;

  // Distance/time from end of A to start of B
  const distAB = distanceMatrix[idxA][idxB];
  const timeAB = timeMatrix[idxA][idxB];

  // Distance/time from A's last customer back to depot (what we're removing)
  const returnDistA = distanceMatrix[idxA][depotIdx];
  const returnTimeA = timeMatrix[idxA][depotIdx];

  // Distance/time from B's last customer back to depot (what we're keeping)
  const returnDistB = distanceMatrix[idxB][depotIdx];
  const returnTimeB = timeMatrix[idxB][depotIdx];

  // New total distance: routeA without its return + A->B link + routeB's return
  const newTotalDistance = routeA.totalDistance - returnDistA + distAB + returnDistB;

  // New total duration: routeA without its return + A->B link + routeB's service times + routeB's return
  // routeA.totalDuration = routeA.lastCustomerTime + returnTimeA
  // We want: routeA.lastCustomerTime + timeAB + sum(stopsB service times + travel times) + returnTimeB
  let currentTime = routeA.lastCustomerTime;
  let prevIdx = idxA;
  for (const stop of stopsB) {
    const customer = locations.find((l) => l.id === stop.locationId)!;
    const stopIdx = locationIndex.get(stop.locationId)!;
    const travelTime = timeMatrix[prevIdx][stopIdx];
    const arrivalTime = currentTime + travelTime;

    const timeWindow = parseTimeWindow(`${customer.timeWindowStart || "06:00"}-${customer.timeWindowEnd || "22:00"}`);
    if (timeWindow && (arrivalTime < timeWindow.start || arrivalTime > timeWindow.end)) {
      const waitTime = timeWindow.start > arrivalTime ? timeWindow.start - arrivalTime : 0;
      if (waitTime > 60) return null;
    }

    currentTime = arrivalTime + customer.serviceTimeMinutes;
    prevIdx = stopIdx;
  }
  // currentTime is now after serving all B's customers
  const newTotalDuration = currentTime + returnTimeB;

  // Check capacity
  const newTotalLoad = routeA.totalLoadKg + routeB.totalLoadKg;
  if (newTotalLoad > vehicle.capacityKg) return null;

  // Check max distance
  if (newTotalDistance > vehicle.maxDistanceKm) return null;

  // Check max duration
  if (newTotalDuration > vehicle.maxDurationMinutes) return null;

  // Merge: rebuild stops from scratch with correct cumulative values
  const newStops: RouteStop[] = [...routeA.stops];

  // Remove the last depot return stop from routeA
  newStops.pop();

  // Add link from A's last customer to B's first customer
  let cumulativeDist = routeA.totalDistance - returnDistA;
  let cumulativeTime = routeA.lastCustomerTime;

  // Add all B's customer stops
  for (let i = 0; i < stopsB.length; i++) {
    const stop = stopsB[i];
    const stopIdx = locationIndex.get(stop.locationId)!;
    const travelDist = distanceMatrix[prevIdx][stopIdx];
    const travelTime = timeMatrix[prevIdx][stopIdx];
    const customer = locations.find((l) => l.id === stop.locationId)!;

    const arrivalTime = cumulativeTime + travelTime;
    const departureTime = arrivalTime + customer.serviceTimeMinutes;
    cumulativeDist += travelDist;
    cumulativeTime = departureTime;

    newStops.push({
      locationId: stop.locationId,
      locationName: stop.locationName,
      sequence: newStops.length,
      arrivalTime: formatTime(arrivalTime),
      departureTime: formatTime(departureTime),
      distanceFromPreviousKm: travelDist,
      durationFromPreviousMin: travelTime,
      cumulativeDistanceKm: cumulativeDist,
      cumulativeDurationMin: cumulativeTime - timeToMinutes("06:00"),
      loadKg: routeA.totalLoadKg + stop.loadKg, // This accumulates correctly as we iterate
      loadL: 0,
    });

    prevIdx = stopIdx;
  }

  // Add final return to depot
  const endLocation = vehicle.endLocation || vehicle.startLocation;
  const endIdx = locationIndex.get(endLocation.id)!;
  const finalReturnDist = distanceMatrix[prevIdx][endIdx];
  const finalReturnTime = timeMatrix[prevIdx][endIdx];
  cumulativeDist += finalReturnDist;
  cumulativeTime += finalReturnTime;

  newStops.push({
    locationId: endLocation.id,
    locationName: endLocation.name,
    sequence: newStops.length,
    arrivalTime: formatTime(cumulativeTime),
    departureTime: formatTime(cumulativeTime),
    distanceFromPreviousKm: finalReturnDist,
    durationFromPreviousMin: finalReturnTime,
    cumulativeDistanceKm: cumulativeDist,
    cumulativeDurationMin: cumulativeTime - timeToMinutes("06:00"),
    loadKg: 0,
    loadL: 0,
  });

  return {
    stops: newStops,
    totalDistance: newTotalDistance,
    totalDuration: newTotalDuration,
    totalLoadKg: newTotalLoad,
    currentTime: cumulativeTime,
    lastCustomerTime: cumulativeTime - finalReturnTime,
    currentLocationIdx: endIdx,
    lastCustomerIdx: prevIdx,
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