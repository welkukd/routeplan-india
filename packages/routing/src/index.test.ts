import { describe, it, expect } from "vitest";
import { solveVRP, createRouteRequestFromOrders, LocationSchema, VehicleSchema } from "./src/index";

describe("VRP Solver", () => {
  const depot = {
    id: "depot",
    name: "Depot",
    address: "Main Warehouse",
    latitude: 19.076,
    longitude: 72.8777,
    demand: 0,
    type: "depot" as const,
  };

  const customer1 = {
    id: "c1",
    name: "Customer 1",
    address: "Andheri East",
    latitude: 19.1197,
    longitude: 72.8464,
    demand: 10,
    timeWindowStart: "09:00",
    timeWindowEnd: "12:00",
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
    timeWindowStart: "10:00",
    timeWindowEnd: "14:00",
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
    costPerKm: 15,
    costPerMinute: 1,
  };

  it("should solve simple VRP with 2 customers", () => {
    const request = {
      locations: [depot, customer1, customer2],
      vehicles: [vehicle],
      options: {
        optimizationGoal: "balanced" as const,
        trafficFactor: 1.3,
        timeLimitSeconds: 30,
      },
    };

    const result = solveVRP(request);

    expect(result.routes.length).toBe(1);
    expect(result.routes[0].stops.length).toBeGreaterThan(2); // depot + customers + return
    expect(result.summary.locationsServed).toBe(2);
    expect(result.summary.vehiclesUsed).toBe(1);
    expect(result.metadata.computationTimeMs).toBeLessThan(5000);
  });

  it("should respect capacity constraints", () => {
    const heavyCustomer = {
      ...customer1,
      id: "c3",
      demand: 150, // Exceeds vehicle capacity
    };

    const request = {
      locations: [depot, heavyCustomer],
      vehicles: [vehicle],
      options: { trafficFactor: 1.3 },
    };

    const result = solveVRP(request);

    expect(result.summary.locationsServed).toBe(0);
    expect(result.unassignedLocations.length).toBe(1);
  });

  it("should create route request from orders", () => {
    const orders = [
      {
        id: "order1",
        customerName: "Customer A",
        address: "Andheri",
        latitude: 19.1197,
        longitude: 72.8464,
        weightKg: 5,
        timeWindowStart: "09:00",
        timeWindowEnd: "12:00",
      },
    ];

    const drivers = [
      {
        id: "driver1",
        name: "Driver A",
        phone: "919876543210",
        vehicleType: "bike" as const,
        capacityKg: 50,
        homeLat: 19.076,
        homeLng: 72.8777,
      },
    ];

    const request = createRouteRequestFromOrders(orders, drivers, depot);

    expect(request.locations.length).toBe(2); // depot + 1 customer
    expect(request.vehicles.length).toBe(1);
    expect(request.vehicles[0].vehicleType).toBe("bike");
  });

  it("should validate location schema", () => {
    const validLocation = {
      id: "test",
      name: "Test",
      address: "Test Address",
      latitude: 19.076,
      longitude: 72.8777,
      demand: 10,
      timeWindowStart: "09:00",
      timeWindowEnd: "18:00",
      serviceTimeMinutes: 5,
      type: "customer" as const,
    };

    const result = LocationSchema.safeParse(validLocation);
    expect(result.success).toBe(true);
  });

  it("should validate vehicle schema", () => {
    const validVehicle = {
      id: "v1",
      driverId: "d1",
      driverName: "Test Driver",
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

    const result = VehicleSchema.safeParse(validVehicle);
    expect(result.success).toBe(true);
  });
});