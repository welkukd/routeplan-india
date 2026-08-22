"use client";

import { useState, useEffect, useCallback } from "react";
import { MapPin, Truck, Clock, Map, RefreshCw, Settings, MoreVertical, X, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Loader2, MapPin as MapPinIcon, User, Package, Navigation, Trash2, Edit, ArrowUpDown, GripVertical, Calendar } from "lucide-react";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/25",
        outline: "border border-border bg-transparent hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-lg px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

function formatCurrency(amount: number, currency: string = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

interface RouteStop {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  latitude: number;
  longitude: number;
  delivery_window_start: string | null;
  delivery_window_end: string | null;
  status: string;
  sequence: number;
  items: any[];
  total_amount: number;
}

interface Route {
  id: string;
  name: string;
  date: string;
  status: "planned" | "active" | "completed" | "cancelled";
  driver_id: string | null;
  driver_name?: string;
  driver_phone?: string;
  vehicle_type?: string;
  total_distance_km: number | null;
  total_duration_min: number | null;
  stops: RouteStop[];
  optimized_order: string[] | null;
  polyline?: string | null;
  created_at: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle_type: string;
  vehicle_number: string | null;
  max_capacity_kg: number | null;
  is_active: boolean;
}

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    planned: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    active: "bg-green-500/20 text-green-400 border-green-500/30",
    completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return styles[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "planned": return <MapPin className="w-3 h-3" />;
    case "active": return <Navigation className="w-3 h-3" />;
    case "completed": return <CheckCircle className="w-3 h-3" />;
    case "cancelled": return <AlertTriangle className="w-3 h-3" />;
    default: return <MapPin className="w-3 h-3" />;
  }
};

const formatDuration = (minutes: number | null) => {
  if (!minutes) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [showRouteDetail, setShowRouteDetail] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dragOverRouteId, setDragOverRouteId] = useState<string | null>(null);
  const [draggedStop, setDraggedStop] = useState<RouteStop | null>(null);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        date,
        limit: "50",
      });
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`/api/admin/routes?${params}`);
      const data = await res.json();
      if (data.routes) {
        // Add sequence to stops based on optimized_order
        const routesWithSequence = data.routes.map((route: Route) => ({
          ...route,
          stops: route.stops.map((stop: RouteStop, idx: number) => ({
            ...stop,
            sequence: route.optimized_order?.indexOf(stop.id) ?? idx + 1,
          })).sort((a: RouteStop, b: RouteStop) => a.sequence - b.sequence),
        }));
        setRoutes(routesWithSequence);
      }
    } catch (error) {
      console.error("Failed to fetch routes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await fetch("/api/admin/drivers?is_active=true&limit=100");
      const data = await res.json();
      if (data.drivers) setDrivers(data.drivers);
    } catch (error) {
      console.error("Failed to fetch drivers:", error);
    }
  };

  useEffect(() => {
    fetchRoutes();
    fetchDrivers();
  }, [date, statusFilter]);

  const handleOptimize = async () => {
    setOptimizing("all");
    try {
      const res = await fetch("/api/admin/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "optimize", date }),
      });
      const data = await res.json();
      if (data.routes) {
        fetchRoutes();
      }
    } catch (error) {
      console.error("Optimization failed:", error);
    } finally {
      setOptimizing(null);
    }
  };

  const handleReassignStop = async (stopId: string, newRouteId: string) => {
    try {
      // Update the order with new route_id
      await fetch(`/api/admin/orders/${stopId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ route_id: newRouteId }),
      });
      fetchRoutes();
    } catch (error) {
      console.error("Reassignment failed:", error);
    }
  };

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, stop: RouteStop, routeId: string) => {
    setDraggedStop(stop);
    e.dataTransfer.setData("stopId", stop.id);
    e.dataTransfer.setData("fromRouteId", routeId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    // routeId will be passed via data attribute on the element
    const routeId = (e.currentTarget as HTMLElement).dataset.routeId;
    if (routeId) setDragOverRouteId(routeId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverRouteId(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const stopId = e.dataTransfer.getData("stopId");
    const fromRouteId = e.dataTransfer.getData("fromRouteId");
    const targetRouteId = (e.currentTarget as HTMLElement).dataset.routeId;
    
    if (stopId && fromRouteId && targetRouteId && fromRouteId !== targetRouteId) {
      handleReassignStop(stopId, targetRouteId);
    }
    setDragOverRouteId(null);
    setDraggedStop(null);
  }, [handleReassignStop]);

  const handleDragEnd = useCallback(() => {
    setDragOverRouteId(null);
    setDraggedStop(null);
  }, []);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      planned: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      active: "bg-green-500/20 text-green-400 border-green-500/30",
      completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return styles[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "planned": return <MapPin className="w-3 h-3" />;
      case "active": return <Navigation className="w-3 h-3" />;
      case "completed": return <CheckCircle className="w-3 h-3" />;
      case "cancelled": return <AlertTriangle className="w-3 h-3" />;
      default: return <MapPin className="w-3 h-3" />;
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "—";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  const activeRoutes = routes.filter(r => r.status === "active");
  const plannedRoutes = routes.filter(r => r.status === "planned");
  const completedRoutes = routes.filter(r => r.status === "completed");

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Route Planning</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and optimize today's delivery routes
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 glass px-3 py-2 rounded-lg border border-border/30">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-foreground w-32"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass px-3 py-2 rounded-lg border border-border/30 text-sm text-foreground bg-background"
          >
            <option value="">All Statuses</option>
            <option value="planned">Planned</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button onClick={handleOptimize} disabled={optimizing === "all"} className="gap-2">
            <RefreshCw className={cn("w-4 h-4", optimizing === "all" && "animate-spin")} />
            Optimize Routes
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass p-4 border border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Routes</p>
              <p className="font-display text-2xl font-bold text-foreground">{routes.length}</p>
            </div>
          </div>
        </div>
        <div className="glass p-4 border border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Truck className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Routes</p>
              <p className="font-display text-2xl font-bold text-foreground">{activeRoutes.length}</p>
            </div>
          </div>
        </div>
        <div className="glass p-4 border border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Navigation className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Distance</p>
              <p className="font-display text-2xl font-bold text-foreground">
                {routes.reduce((sum, r) => sum + (r.total_distance_km || 0), 0).toFixed(1)} km
              </p>
            </div>
          </div>
        </div>
        <div className="glass p-4 border border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Duration</p>
              <p className="font-display text-2xl font-bold text-foreground">
                {formatDuration(routes.reduce((sum, r) => sum + (r.total_duration_min || 0), 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Routes List */}
      <div className="space-y-4">
        {[{ label: "Planned", routes: plannedRoutes, color: "blue" }, 
          { label: "Active", routes: activeRoutes, color: "green" },
          { label: "Completed", routes: completedRoutes, color: "emerald" }].map((group) => (
          group.routes.length > 0 && (
            <div key={group.label} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {group.label} ({group.routes.length})
              </h3>
              <div className="space-y-3">
                {group.routes.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    drivers={drivers}
                    dragOver={dragOverRouteId === route.id}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    onViewDetail={() => { setSelectedRoute(route); setShowRouteDetail(true); }}
                    onOptimize={() => {}}
                    onReassign={(stopId, newRouteId) => handleReassignStop(stopId, newRouteId)}
                    draggedStop={draggedStop}
                    setDraggedStop={setDraggedStop}
                  />
                ))}
              </div>
            </div>
          )
        ))}
        {routes.length === 0 && (
          <div className="glass p-12 text-center border border-border/30">
            <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">No routes for this date</h3>
            <p className="text-sm text-muted-foreground">
              Create orders or run optimization to generate routes
            </p>
          </div>
        )}
      </div>

      {/* Route Detail Modal */}
      {showRouteDetail && selectedRoute && (
        <RouteDetailModal
          route={selectedRoute}
          drivers={drivers}
          onClose={() => setShowRouteDetail(false)}
          onReassign={handleReassignStop}
          onOptimize={handleOptimize}
        />
      )}
    </div>
  );
}

// Route Card Component
function RouteCard({
  route,
  drivers,
  dragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onViewDetail,
  onReassign,
  draggedStop,
  setDraggedStop,
}: {
  route: Route;
  drivers: Driver[];
  dragOver: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, stop: RouteStop, routeId: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onViewDetail: () => void;
  onOptimize: () => void;
  onReassign: (stopId: string, newRouteId: string) => void;
  draggedStop: RouteStop | null;
  setDraggedStop: (stop: RouteStop | null) => void;
}) {
  const driver = drivers.find(d => d.id === route.driver_id);
  const stopsCount = route.stops.length;
  const unassignedStops = route.stops.filter(s => s.status === "pending").length;

  return (
    <div
      className={cn(
        "glass p-4 rounded-xl border transition-all duration-200",
        dragOver ? "border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/20" : "border-border/30 hover:border-border/50"
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      data-route-id={route.id}
    >
      <div className="flex items-start gap-4">
        {/* Route Header */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              route.status === "active" && "bg-green-500/20",
              route.status === "planned" && "bg-blue-500/20",
              route.status === "completed" && "bg-emerald-500/20",
              route.status === "cancelled" && "bg-red-500/20"
            )}>
              {getStatusIcon(route.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-foreground truncate">{route.name}</h4>
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                  getStatusBadge(route.status)
                )}>
                  {getStatusIcon(route.status)}
                  {route.status.charAt(0).toUpperCase() + route.status.slice(1)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {driver ? `${driver.name} • ${driver.vehicle_type}` : "Unassigned"} • {stopsCount} stops
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onViewDetail} aria-label="View route details">
                <Map className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Route Stats */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
            {route.total_distance_km && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{route.total_distance_km.toFixed(1)} km</span>
              </div>
            )}
            {route.total_duration_min && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDuration(route.total_duration_min)}</span>
              </div>
            )}
            {driver && (
              <div className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span>{driver.name}</span>
              </div>
            )}
          </div>

          {/* Stops List - Draggable */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {route.stops.map((stop, index) => (
              <DraggableStop
                key={stop.id}
                stop={stop}
                index={index}
                routeId={route.id}
                onDragStart={onDragStart}
                isDragging={draggedStop?.id === stop.id}
                draggedStop={draggedStop}
              />
            ))}
            {route.stops.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No stops assigned</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Draggable Stop Component
function DraggableStop({
  stop,
  index,
  routeId,
  onDragStart,
  isDragging,
  draggedStop,
}: {
  stop: RouteStop;
  index: number;
  routeId: string;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, stop: RouteStop, routeId: string) => void;
  isDragging: boolean;
  draggedStop: RouteStop | null;
}) {
  const hasTimeWindow = stop.delivery_window_start || stop.delivery_window_end;
  const timeWindow = hasTimeWindow
    ? `${stop.delivery_window_start || "—"} - ${stop.delivery_window_end || "—"}`
    : null;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, stop, routeId)}
      className={cn(
        "glass p-3 rounded-lg border border-border/30 flex items-center gap-3 transition-all",
        isDragging && "opacity-50 rotate-1 scale-102 shadow-lg"
      )}
    >
      <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab active:cursor-grabbing flex-shrink-0" />
      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{stop.customer_name}</p>
        <p className="text-xs text-muted-foreground truncate">{stop.address}</p>
        {timeWindow && (
          <p className="text-xs text-amber-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {timeWindow}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="px-2 py-0.5 rounded bg-background">{stop.order_number}</span>
        {stop.total_amount > 0 && (
          <span>{formatCurrency(stop.total_amount)}</span>
        )}
      </div>
    </div>
  );
}

// Route Detail Modal
function RouteDetailModal({
  route,
  drivers,
  onClose,
  onReassign,
  onOptimize,
}: {
  route: Route;
  drivers: Driver[];
  onClose: () => void;
  onReassign: (stopId: string, newRouteId: string) => void;
  onOptimize: () => void;
}) {
  const driver = drivers.find(d => d.id === route.driver_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-border/30 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              route.status === "active" && "bg-green-500/20",
              route.status === "planned" && "bg-blue-500/20",
              route.status === "completed" && "bg-emerald-500/20",
            )}>
              {getStatusIcon(route.status)}
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">{route.name}</h2>
              <p className="text-sm text-muted-foreground">
                {driver ? `${driver.name} • ${driver.vehicle_type}` : "Unassigned"} • {route.stops.length} stops
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Map / Route Visualization */}
            <div className="lg:col-span-2 space-y-4">
              {/* Map Placeholder */}
              <div className="glass aspect-video rounded-xl border border-border/30 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPin className="w-12 h-12 text-muted-foreground/30" />
                </div>
                <div className="absolute bottom-3 left-3 right-3 glass px-3 py-2 rounded-lg text-xs text-muted-foreground">
                  Map view - {route.stops.length} stops plotted
                  {route.polyline && <span className="ml-2">• Route polyline available</span>}
                </div>
              </div>

              {/* Route Timeline */}
              <div className="glass p-4 rounded-xl border border-border/30">
                <h3 className="font-semibold text-foreground mb-3">Route Timeline</h3>
                <div className="space-y-3">
                  {route.stops.map((stop, index) => (
                    <div key={stop.id} className="flex items-start gap-3 relative">
                      <div className="relative flex-shrink-0">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2",
                          index === 0 ? "bg-green-500 border-green-500 text-green-500" :
                          index === route.stops.length - 1 ? "bg-red-500 border-red-500 text-red-500" :
                          "bg-primary border-primary text-primary"
                        )}>
                          {index === 0 ? <MapPinIcon className="w-4 h-4" /> : index === route.stops.length - 1 ? <MapPinIcon className="w-4 h-4" /> : index + 1}
                        </div>
                        {index < route.stops.length - 1 && (
                          <div className="absolute left-3.5 top-8 bottom-0 w-0.5 bg-border/50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-sm font-medium text-foreground truncate">{stop.customer_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{stop.address}</p>
                        {stop.delivery_window_start && (
                          <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" /> {stop.delivery_window_start} - {stop.delivery_window_end || "—"}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{formatCurrency(stop.total_amount)}</span>
                          <span className="px-1.5 py-0.5 rounded bg-background text-[10px]">{stop.status}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100"
                        onClick={() => {}}
                        aria-label="Reassign stop"
                      >
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar - Route Details & Actions */}
            <div className="space-y-4">
              {/* Driver Assignment */}
              <div className="glass p-4 rounded-xl border border-border/30">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" /> Driver Assignment
                </h3>
                {driver ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 glass rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{driver.name}</p>
                        <p className="text-sm text-muted-foreground">{driver.phone}</p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                        {driver.vehicle_type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Capacity: {driver.max_capacity_kg || "—"} kg
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">No driver assigned</p>
                    <select
                      className="w-full glass px-3 py-2 rounded-lg border border-border/30 text-sm text-foreground bg-background"
                      onChange={(e) => onReassign("", e.target.value)}
                    >
                      <option value="">Assign driver...</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.vehicle_type})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Route Stats */}
              <div className="glass p-4 rounded-xl border border-border/30">
                <h3 className="font-semibold text-foreground mb-3">Route Statistics</h3>
                <div className="space-y-2">
                  <StatRow label="Total Distance" value={route.total_distance_km ? `${route.total_distance_km.toFixed(1)} km` : "—"} />
                  <StatRow label="Est. Duration" value={route.total_duration_min ? formatDuration(route.total_duration_min) : "—"} />
                  <StatRow label="Stops" value={route.stops.length.toString()} />
                  <StatRow label="Pending" value={route.stops.filter(s => s.status === "pending").length.toString()} />
                  <StatRow label="Delivered" value={route.stops.filter(s => s.status === "delivered").length.toString()} />
                  <StatRow label="Revenue" value={formatCurrency(route.stops.reduce((sum, s) => sum + s.total_amount, 0))} />
                </div>
              </div>

              {/* Actions */}
              <div className="glass p-4 rounded-xl border border-border/30">
                <h3 className="font-semibold text-foreground mb-3">Actions</h3>
                <div className="space-y-2">
                  <Button className="w-full justify-start gap-2" variant="outline" onClick={onOptimize}>
                    <RefreshCw className="w-4 h-4" />
                    Re-optimize Route
                  </Button>
                  <Button className="w-full justify-start gap-2" variant="outline">
                    <Package className="w-4 h-4" />
                    Send to Driver (WhatsApp)
                  </Button>
                  <Button className="w-full justify-start gap-2" variant="outline">
                    <Navigation className="w-4 h-4" />
                    Start Navigation
                  </Button>
                  {route.status === "planned" && (
                    <Button className="w-full justify-start gap-2" variant="default">
                      <Navigation className="w-4 h-4" />
                      Start Route
                    </Button>
                  )}
                  {route.status === "active" && (
                    <Button className="w-full justify-start gap-2" variant="default" style={{ background: "hsl(var(--destructive))" }}>
                      <CheckCircle className="w-4 h-4" />
                      Complete Route
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}