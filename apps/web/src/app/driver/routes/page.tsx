"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronRight,
  ChevronLeft,
  PlayCircle,
  CheckCircle2,
  MapPin,
  Clock,
  Truck,
  Map,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Loader2,
  Home,
  List,
  Calendar,
  Flag,
  Package,
  IndianRupee,
  User,
} from "lucide-react";
import { useDriverStore } from "../store";
import { cn } from "@routeplan/ui";
import { Button } from "@routeplan/ui";

const TRANSLATIONS = {
  en: {
    myRoutes: "My Routes",
    noRoutes: "No routes assigned",
    noRoutesDesc: "You don't have any routes scheduled for today.",
    planned: "Planned",
    active: "Active",
    completed: "Completed",
    cancelled: "Cancelled",
    startRoute: "Start Route",
    completeRoute: "Complete Route",
    viewDetails: "View Details",
    totalDistance: "Total Distance",
    estimatedTime: "Estimated Time",
    stops: "Stops",
    depot: "Depot",
    customer: "Customer",
    arrival: "Arrival",
    departure: "Departure",
    distance: "Distance",
    duration: "Duration",
    navigate: "Navigate",
    pullToRefresh: "Pull to refresh",
    loading: "Loading...",
    error: "Error loading routes",
    retry: "Retry",
    today: "Today",
    tomorrow: "Tomorrow",
    routeStarted: "Route started successfully",
    routeCompleted: "Route completed successfully",
    confirmComplete: "Complete this route?",
    confirmCompleteDesc: "This will mark all remaining stops as completed.",
    dashboard: "Dashboard",
    routes: "My Routes",
    orders: "Orders",
    earnings: "Earnings",
    profile: "Profile",
  },
  hi: {
    myRoutes: "मेरे रूट",
    noRoutes: "कोई रूट असाइन नहीं",
    noRoutesDesc: "आज के लिए आपके पास कोई निर्धारित रूट नहीं है।",
    planned: "नियोजित",
    active: "सक्रिय",
    completed: "पूर्ण",
    cancelled: "रद्द",
    startRoute: "रूट शुरू करें",
    completeRoute: "रूट पूरा करें",
    viewDetails: "विवरण देखें",
    totalDistance: "कुल दूरी",
    estimatedTime: "अनुमानित समय",
    stops: "स्टॉप",
    depot: "डिपो",
    customer: "ग्राहक",
    arrival: "आगमन",
    departure: "प्रस्थान",
    distance: "दूरी",
    duration: "अवधि",
    navigate: "नेविगेट",
    pullToRefresh: "रीफ्रेश करने के लिए खींचें",
    loading: "लोड हो रहा है...",
    error: "रूट लोड करने में त्रुटि",
    retry: "पुनः प्रयास",
    today: "आज",
    tomorrow: "कल",
    routeStarted: "रूट सफलतापूर्वक शुरू हुआ",
    routeCompleted: "रूट सफलतापूर्वक पूरा हुआ",
    confirmComplete: "इस रूट को पूरा करें?",
    confirmCompleteDesc: "यह सभी शेष स्टॉप को पूर्ण के रूप में चिह्नित करेगा।",
    dashboard: "डैशबोर्ड",
    routes: "मेरे रूट",
    orders: "ऑर्डर",
    earnings: "कमाई",
    profile: "प्रोफाइल",
  },
};

type Language = "en" | "hi";
type TranslationKey = keyof typeof TRANSLATIONS.en;

interface RouteStop {
  locationId: string;
  locationName: string;
  sequence: number;
  arrivalTime: string;
  departureTime: string;
  distanceFromPreviousKm: number;
  durationFromPreviousMin: number;
  cumulativeDistanceKm: number;
  cumulativeDurationMin: number;
  latitude?: number;
  longitude?: number;
}

interface Route {
  id: string;
  name: string;
  date: string;
  status: "planned" | "active" | "completed" | "cancelled";
  stops: RouteStop[];
  totalDistanceKm: number;
  totalDurationMin: number;
  driverId: string;
}

function t(key: TranslationKey, lang: Language): string {
  return TRANSLATIONS[lang][key] || TRANSLATIONS.en[key];
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function getStatusColor(status: Route["status"]): string {
  switch (status) {
    case "planned":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "active":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "completed":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "cancelled":
      return "bg-red-500/20 text-red-400 border-red-500/30";
  }
}

function getStatusIcon(status: Route["status"]) {
  switch (status) {
    case "planned":
      return <Clock className="w-4 h-4" />;
    case "active":
      return <PlayCircle className="w-4 h-4" />;
    case "completed":
      return <CheckCircle2 className="w-4 h-4" />;
    case "cancelled":
      return <AlertCircle className="w-4 h-4" />;
  }
}

export default function DriverRoutesPage() {
  const { language, isOnline, setRoute, currentRouteId } = useDriverStore();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState<string | null>(null);

  const loadRoutes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // In production, this would fetch from API
      // const response = await fetch("/api/driver/routes");
      // const data = await response.json();
      // setRoutes(data);
      
      // Mock data for now
      const mockRoutes: Route[] = [
        {
          id: "route-1",
          name: "Morning Milk Run - Andheri",
          date: new Date().toISOString().split("T")[0],
          status: "planned",
          driverId: "driver-1",
          stops: [
            { locationId: "depot", locationName: "Central Depot - Andheri", sequence: 0, arrivalTime: "05:30", departureTime: "05:45", distanceFromPreviousKm: 0, durationFromPreviousMin: 0, cumulativeDistanceKm: 0, cumulativeDurationMin: 0 },
            { locationId: "cust-1", locationName: "Sharma Dairy - Jogeshwari", sequence: 1, arrivalTime: "06:00", departureTime: "06:10", distanceFromPreviousKm: 3.2, durationFromPreviousMin: 15, cumulativeDistanceKm: 3.2, cumulativeDurationMin: 15 },
            { locationId: "cust-2", locationName: "Patel Kirana - Goregaon", sequence: 2, arrivalTime: "06:25", departureTime: "06:35", distanceFromPreviousKm: 4.1, durationFromPreviousMin: 15, cumulativeDistanceKm: 7.3, cumulativeDurationMin: 30 },
            { locationId: "cust-3", locationName: "Gupta Pharmacy - Malad", sequence: 3, arrivalTime: "06:50", departureTime: "07:00", distanceFromPreviousKm: 3.8, durationFromPreviousMin: 15, cumulativeDistanceKm: 11.1, cumulativeDurationMin: 45 },
            { locationId: "cust-4", locationName: "Singh Bakery - Kandivali", sequence: 4, arrivalTime: "07:15", departureTime: "07:25", distanceFromPreviousKm: 4.5, durationFromPreviousMin: 15, cumulativeDistanceKm: 15.6, cumulativeDurationMin: 60 },
            { locationId: "depot", locationName: "Central Depot - Andheri", sequence: 5, arrivalTime: "07:45", departureTime: "07:45", distanceFromPreviousKm: 5.2, durationFromPreviousMin: 20, cumulativeDistanceKm: 20.8, cumulativeDurationMin: 80 },
          ],
          totalDistanceKm: 20.8,
          totalDurationMin: 80,
        },
        {
          id: "route-2",
          name: "Evening Pharmacy Run - Bandra",
          date: new Date().toISOString().split("T")[0],
          status: "planned",
          driverId: "driver-1",
          stops: [
            { locationId: "depot", locationName: "Central Depot - Bandra", sequence: 0, arrivalTime: "14:00", departureTime: "14:15", distanceFromPreviousKm: 0, durationFromPreviousMin: 0, cumulativeDistanceKm: 0, cumulativeDurationMin: 0 },
            { locationId: "cust-5", locationName: "Mumbai Medical - Khar", sequence: 1, arrivalTime: "14:30", departureTime: "14:40", distanceFromPreviousKm: 2.1, durationFromPreviousMin: 15, cumulativeDistanceKm: 2.1, cumulativeDurationMin: 15 },
            { locationId: "cust-6", locationName: "Health Plus - Santacruz", sequence: 2, arrivalTime: "14:55", departureTime: "15:05", distanceFromPreviousKm: 3.5, durationFromPreviousMin: 15, cumulativeDistanceKm: 5.6, cumulativeDurationMin: 30 },
          ],
          totalDistanceKm: 9.2,
          totalDurationMin: 45,
        },
        {
          id: "route-3",
          name: "Yesterday's Bakery Delivery - Dadar",
          date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
          status: "completed",
          driverId: "driver-1",
          stops: [
            { locationId: "depot", locationName: "Central Depot - Dadar", sequence: 0, arrivalTime: "06:00", departureTime: "06:15", distanceFromPreviousKm: 0, durationFromPreviousMin: 0, cumulativeDistanceKm: 0, cumulativeDurationMin: 0 },
            { locationId: "cust-7", locationName: "Sweet Corner - Dadar", sequence: 1, arrivalTime: "06:30", departureTime: "06:40", distanceFromPreviousKm: 2.5, durationFromPreviousMin: 15, cumulativeDistanceKm: 2.5, cumulativeDurationMin: 15 },
            { locationId: "depot", locationName: "Central Depot - Dadar", sequence: 2, arrivalTime: "07:00", departureTime: "07:00", distanceFromPreviousKm: 3.0, durationFromPreviousMin: 20, cumulativeDistanceKm: 5.5, cumulativeDurationMin: 35 },
          ],
          totalDistanceKm: 5.5,
          totalDurationMin: 35,
        },
      ];
      setRoutes(mockRoutes);
    } catch (err) {
      setError(t("error", language));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [language]);

  useEffect(() => {
    queueMicrotask(() => loadRoutes());
  }, [loadRoutes]);

  const handleStartRoute = (route: Route) => {
    setRoute(route.id);
    // In production: await fetch("/api/driver/routes/start", { method: "POST", body: JSON.stringify({ routeId: route.id }) });
    alert(t("routeStarted", language));
  };

  const handleCompleteRoute = (routeId: string) => {
    setShowCompleteConfirm(routeId);
  };

  const handleConfirmComplete = async (routeId: string) => {
    try {
      // In production: await fetch("/api/driver/routes/complete", { method: "POST", body: JSON.stringify({ routeId }) });
      setRoute(null);
      setShowCompleteConfirm(null);
      await loadRoutes();
      alert(t("routeCompleted", language));
    } catch (err) {
      alert("Failed to complete route");
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRoutes();
  };

  const handleNavigate = (stop: RouteStop) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const url = `https://www.google.com/maps/dir/?api=1&origin=${pos.coords.latitude},${pos.coords.longitude}&destination=${stop.latitude || 0},${stop.longitude || 0}&travelmode=driving`;
        window.open(url, "_blank");
      });
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${stop.latitude || 0},${stop.longitude || 0}`;
      window.open(url, "_blank");
    }
  };

  const todayRoutes = routes.filter(r => r.date === new Date().toISOString().split("T")[0]);
  const pastRoutes = routes.filter(r => r.date !== new Date().toISOString().split("T")[0]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-strong border-b border-border/50 backdrop-blur-xl">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="btn-ghost p-2" onClick={() => window.history.back()}>
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-foreground">{t("myRoutes", language)}</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto px-4 py-4 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="mt-3 text-muted-foreground">{t("loading", language)}</p>
          </div>
        ) : error ? (
          <div className="glass p-6 rounded-2xl text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
            <p className="text-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh} className="w-full">{t("retry", language)}</Button>
          </div>
        ) : todayRoutes.length === 0 && pastRoutes.length === 0 ? (
          <div className="glass p-8 rounded-2xl text-center">
            <Map className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">{t("noRoutes", language)}</h2>
            <p className="text-muted-foreground mb-6">{t("noRoutesDesc", language)}</p>
            <Button onClick={handleRefresh} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" /> {t("retry", language)}
            </Button>
          </div>
        ) : (
          <>
            {todayRoutes.length > 0 && (
              <section className="mb-6">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                  {t("today", language)}
                </h2>
                <div className="space-y-3">
                  {todayRoutes.map((route) => (
                    <RouteCard
                      key={route.id}
                      route={route}
                      isActive={currentRouteId === route.id}
                      expanded={expandedRoute === route.id}
                      onToggle={() => setExpandedRoute(expandedRoute === route.id ? null : route.id)}
                      onStart={() => handleStartRoute(route)}
                      onComplete={() => handleCompleteRoute(route.id)}
                      onNavigate={handleNavigate}
                      language={language}
                    />
                  ))}
                </div>
              </section>
            )}

            {pastRoutes.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                  {t("tomorrow", language)} / Previous
                </h2>
                <div className="space-y-3">
                  {pastRoutes.map((route) => (
                    <RouteCard
                      key={route.id}
                      route={route}
                      isActive={false}
                      expanded={expandedRoute === route.id}
                      onToggle={() => setExpandedRoute(expandedRoute === route.id ? null : route.id)}
                      onStart={() => {}}
                      onComplete={() => {}}
                      onNavigate={handleNavigate}
                      language={language}
                      disabled={true}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {showCompleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCompleteConfirm(null)} />
            <div className="relative glass-strong rounded-2xl p-6 w-full max-w-sm animate-slide-up">
              <h3 className="text-lg font-semibold text-foreground mb-2">{t("confirmComplete", language)}</h3>
              <p className="text-muted-foreground mb-6">{t("confirmCompleteDesc", language)}</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowCompleteConfirm(null)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={() => handleConfirmComplete(showCompleteConfirm)}>
                  {t("completeRoute", language)}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass-strong border-t border-border/50 backdrop-blur-xl">
        <div className="grid grid-cols-5">
          <NavItem href="/driver" icon={<Home className="w-5 h-5" />} label={t("dashboard", language)} active={false} />
          <NavItem href="/driver/routes" icon={<List className="w-5 h-5" />} label={t("routes", language)} active={true} />
          <NavItem href="/driver/orders" icon={<Package className="w-5 h-5" />} label={t("orders", language)} active={false} />
          <NavItem href="/driver/earnings" icon={<IndianRupee className="w-5 h-5" />} label={t("earnings", language)} active={false} />
          <NavItem href="/driver/profile" icon={<User className="w-5 h-5" />} label={t("profile", language)} active={false} />
        </div>
      </nav>
    </div>
  );
}

function RouteCard({
  route,
  isActive,
  expanded,
  onToggle,
  onStart,
  onComplete,
  onNavigate,
  language,
  disabled = false,
}: {
  route: Route;
  isActive: boolean;
  expanded: boolean;
  onToggle: () => void;
  onStart: () => void;
  onComplete: () => void;
  onNavigate: (stop: RouteStop) => void;
  language: Language;
  disabled?: boolean;
}) {
  const customerStops = route.stops.filter(s => s.locationId !== "depot");
  const isCompleted = route.status === "completed";
  const isCancelled = route.status === "cancelled";

  return (
    <div className={cn("glass rounded-2xl border border-border/50 overflow-hidden transition-all", isActive && "ring-2 ring-primary/50")}>
      {/* Route Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between gap-4"
        disabled={disabled}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-foreground truncate">{route.name}</h3>
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", getStatusColor(route.status))}>
              {getStatusIcon(route.status)}
              {t(route.status, language)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {customerStops.length} {t("stops", language)}
            </span>
            <span className="flex items-center gap-1">
              <Map className="w-3 h-3" /> {route.totalDistanceKm.toFixed(1)} km
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatTime(route.totalDurationMin)}
            </span>
          </div>
        </div>
        <ChevronRight className={cn("w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform", expanded && "rotate-90")} />
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-border/50 p-4 animate-slide-down">
          <div className="space-y-3">
            {route.stops.map((stop, index) => (
              <div
                key={stop.locationId}
                className={cn("flex items-center gap-3 p-3 rounded-xl relative", stop.locationId === "depot" ? "bg-primary/10" : "glass")}
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium">
                  {stop.sequence === 0 ? (
                    <Truck className="w-4 h-4" />
                  ) : stop.sequence === route.stops.length - 1 ? (
                    <Flag className="w-4 h-4" />
                  ) : (
                    stop.sequence
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{stop.locationName}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("arrival", language)}: {stop.arrivalTime} | {t("departure", language)}: {stop.departureTime}
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  {stop.distanceFromPreviousKm > 0 && (
                    <>
                      <span>{stop.distanceFromPreviousKm.toFixed(1)} km</span>
                      <br />
                      <span>{stop.durationFromPreviousMin} min</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isCompleted && !isCancelled && !disabled && (
        <div className="border-t border-border/50 p-4 flex gap-3">
          {route.status === "planned" && (
            <Button onClick={onStart} className="flex-1" size="lg">
              <PlayCircle className="w-4 h-4 mr-2" /> {t("startRoute", language)}
            </Button>
          )}
          {route.status === "active" && (
            <Button onClick={onComplete} variant="outline" className="flex-1" size="lg">
              <CheckCircle2 className="w-4 h-4 mr-2" /> {t("completeRoute", language)}
            </Button>
          )}
          {route.status === "active" && (
            <Button variant="ghost" onClick={() => onNavigate(route.stops[route.stops.findIndex(s => s.sequence > 0) || 1])} size="lg">
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <a
      href={href}
      className={cn("flex flex-col items-center justify-center py-3 px-2 transition-colors", active ? "text-primary" : "text-muted-foreground")}
    >
      <span className={cn("text-lg", active && "text-primary")}>{icon}</span>
      <span className={cn("text-xs font-medium mt-1", active && "text-primary")}>{label}</span>
      {active && <div className="w-2 h-2 rounded-full bg-primary mt-1" />}
    </a>
  );
}