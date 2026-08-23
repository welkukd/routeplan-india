"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Truck,
  MapPin,
  CheckCircle,
  XCircle,
  Navigation,
  Package,
  Clock,
  Map,
  Home,
  Menu,
  X,
  RefreshCw,
  AlertCircle,
  Battery,
  Wifi,
  WifiOff,
  Satellite,
  SatelliteDish,
  Settings,
  LogOut,
  User,
  Bell,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  Edit,
  Trash2,
  Eye,
  ExternalLink,
  Loader2,
  Download,
  Upload,
  FolderSync,
  Info,
  HelpCircle,
  Shield,
  Star,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  CreditCard,
  IndianRupee,
  BarChart2,
  Activity,
  Target,
  Flag,
  FlagTriangleRight,
  MapPinCheckInside,
  Route,
  Truck as TruckIcon,
  UserCheck,
  PackageCheck,
  Check,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useDriverStore } from "./store";

const TRANSLATIONS = {
  en: {
    appTitle: "RoutePlan Driver",
    dashboard: "Dashboard",
    routes: "My Routes",
    orders: "Orders",
    earnings: "Earnings",
    profile: "Profile",
    settings: "Settings",
    logout: "Logout",
    goOnline: "Go Online",
    goOffline: "Go Offline",
    online: "Online",
    offline: "Offline",
    noActiveRoute: "No active route",
    startRoute: "Start Route",
    completeRoute: "Complete Route",
    currentRoute: "Current Route",
    upcomingRoutes: "Upcoming Routes",
    completedRoutes: "Completed Routes",
    totalDistance: "Total Distance",
    estimatedTime: "Estimated Time",
    stops: "Stops",
    pending: "Pending",
    inProgress: "In Progress",
    assigned: "Assigned",
    completed: "Completed",
    cancelled: "Cancelled",
    delivered: "Delivered",
    failed: "Failed",
    pickup: "Pickup",
    delivery: "Delivery",
    customer: "Customer",
    address: "Address",
    contact: "Contact",
    notes: "Notes",
    weight: "Weight",
    items: "Items",
    amount: "Amount",
    cod: "COD",
    prepaid: "Prepaid",
    navigate: "Navigate",
    call: "Call",
    message: "Message",
    markPickedUp: "Mark Picked Up",
    markDelivered: "Mark Delivered",
    markFailed: "Mark Failed",
    reason: "Reason",
    submit: "Submit",
    cancel: "Cancel",
    confirm: "Confirm",
    retry: "Retry",
    refresh: "Refresh",
    sync: "Sync",
    offlineMode: "Offline Mode",
    dataSynced: "Data Synced",
    lastSync: "Last Sync",
    never: "Never",
    gpsStatus: "GPS",
    networkStatus: "Network",
    batteryLevel: "Battery",
    language: "Language",
    english: "English",
    hindi: "हिन्दी",
    selectLanguage: "Select Language",
    darkMode: "Dark Mode",
    notifications: "Notifications",
    help: "Help & Support",
    about: "About",
    version: "Version",
    todayEarnings: "Today's Earnings",
    totalEarnings: "Total Earnings",
    thisWeek: "This Week",
    thisMonth: "This Month",
    ordersCompleted: "Orders Completed",
    acceptanceRate: "Acceptance Rate",
    rating: "Rating",
    noOrders: "No orders yet",
    pullToRefresh: "Pull to refresh",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    warning: "Warning",
    info: "Info",
    routeStarted: "Route started",
    routeCompleted: "Route completed",
    orderPickedUp: "Order picked up",
    orderDelivered: "Order delivered",
    orderFailed: "Order marked failed",
    syncComplete: "Sync complete",
    syncFailed: "Sync failed",
    pleaseWait: "Please wait...",
    noInternet: "No internet connection",
    changesWillSync: "Changes will sync when online",
    deliveryWindowStart: "Delivery Window",
    tapStartRoute: "Tap to start route",
    swipeToRefresh: "Swipe down to refresh",
    tapForDetails: "Tap for details",
    longPressForOptions: "Long press for options",
  },
  hi: {
    appTitle: "रूटप्लान ड्राइवर",
    dashboard: "डैशबोर्ड",
    routes: "मेरे रूट",
    orders: "ऑर्डर",
    earnings: "कमाई",
    profile: "प्रोफाइल",
    settings: "सेटिंग्स",
    logout: "लॉगआउट",
    goOnline: "ऑनलाइन जाएं",
    goOffline: "ऑफलाइन जाएं",
    online: "ऑनलाइन",
    offline: "ऑफलाइन",
    noActiveRoute: "कोई सक्रिय रूट नहीं",
    startRoute: "रूट शुरू करें",
    completeRoute: "रूट पूरा करें",
    currentRoute: "वर्तमान रूट",
    upcomingRoutes: "आने वाले रूट",
    completedRoutes: "पूर्ण रूट",
    totalDistance: "कुल दूरी",
    estimatedTime: "अनुमानित समय",
    stops: "स्टॉप",
    pending: "लंबित",
    inProgress: "प्रगति में",
    assigned: "असाइन किया गया",
    completed: "पूर्ण",
    cancelled: "रद्द",
    delivered: "डिलीवर",
    failed: "विफल",
    pickup: "पिकअप",
    delivery: "डिलीवरी",
    customer: "ग्राहक",
    address: "पता",
    contact: "संपर्क",
    notes: "नोट्स",
    weight: "वजन",
    items: "आइटम",
    amount: "राशि",
    cod: "कैश ऑन डिलीवरी",
    prepaid: "प्रीपेड",
    navigate: "नेविगेट",
    call: "कॉल",
    message: "संदेश",
    markPickedUp: "पिकअप चिह्नित करें",
    markDelivered: "डिलीवर चिह्नित करें",
    markFailed: "विफल चिह्नित करें",
    reason: "कारण",
    submit: "जमा करें",
    cancel: "रद्द करें",
    confirm: "पुष्टि करें",
    retry: "पुनः प्रयास",
    refresh: "रीफ्रेश",
    sync: "सिंक",
    offlineMode: "ऑफलाइन मोड",
    dataSynced: "डेटा सिंक हुआ",
    lastSync: "अंतिम सिंक",
    never: "कभी नहीं",
    gpsStatus: "GPS",
    networkStatus: "नेटवर्क",
    batteryLevel: "बैटरी",
    language: "भाषा",
    english: "English",
    hindi: "हिन्दी",
    selectLanguage: "भाषा चुनें",
    darkMode: "डार्क मोड",
    notifications: "सूचनाएं",
    help: "सहायता",
    about: "जानकारी",
    version: "संस्करण",
    todayEarnings: "आज की कमाई",
    totalEarnings: "कुल कमाई",
    thisWeek: "इस सप्ताह",
    thisMonth: "इस महीने",
    ordersCompleted: "पूर्ण ऑर्डर",
    acceptanceRate: "स्वीकृति दर",
    rating: "रेटिंग",
    noOrders: "अभी कोई ऑर्डर नहीं",
    pullToRefresh: "रीफ्रेश करने के लिए खींचें",
    loading: "लोड हो रहा है...",
    error: "त्रुटि",
    success: "सफलता",
    warning: "चेतावनी",
    info: "जानकारी",
    routeStarted: "रूट शुरू हुआ",
    routeCompleted: "रूट पूरा हुआ",
    orderPickedUp: "ऑर्डर पिकअप हुआ",
    orderDelivered: "ऑर्डर डिलीवर हुआ",
    orderFailed: "ऑर्डर विफल चिह्नित",
    syncComplete: "सिंक पूर्ण",
    syncFailed: "सिंक विफल",
    pleaseWait: "कृपया प्रतीक्षा करें...",
    noInternet: "इंटरनेट कनेक्शन नहीं",
    changesWillSync: "ऑनलाइन होने पर बदलाव सिंक होंगे",
    swipeToRefresh: "रीफ्रेश करने के लिए नीचे खींचें",
    deliveryWindowStart: "डिलीवरी विंडो",
    tapStartRoute: "रूट शुरू करने के लिए टैप करें",
    tapForDetails: "विवरण के लिए टैप करें",
    longPressForOptions: "विकल्पों के लिए देर तक दबाएं",
  },
};

type Language = "en" | "hi";
type TranslationKey = keyof typeof TRANSLATIONS.en;

function t(key: TranslationKey, lang: Language): string {
  return TRANSLATIONS[lang][key] || TRANSLATIONS.en[key];
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  latitude: number;
  longitude: number;
  status: "pending" | "assigned" | "picked_up" | "delivered" | "cancelled" | "failed";
  type: "pickup" | "delivery";
  items: Array<{ name: string; quantity: number; weight: number }>;
  total_weight: number;
  total_amount: number;
  payment_type: "cod" | "prepaid";
  delivery_window_start?: string;
  delivery_window_end?: string;
  notes?: string;
  sequence: number;
  proof_of_delivery?: string;
}

interface Route {
  id: string;
  name: string;
  date: string;
  status: "planned" | "active" | "completed" | "cancelled";
  stops: Array<{
    locationId: string;
    locationName: string;
    sequence: number;
    arrivalTime: string;
    departureTime: string;
    distanceFromPreviousKm: number;
    durationFromPreviousMin: number;
    cumulativeDistanceKm: number;
    cumulativeDurationMin: number;
  }>;
  totalDistanceKm: number;
  totalDurationMin: number;
  driverId: string;
}

const MOCK_ROUTES: Route[] = [
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
];

const MOCK_ORDERS: Order[] = [
  {
    id: "order-1",
    order_number: "RP-2024-001",
    customer_name: "Sharma Dairy",
    customer_phone: "919876543210",
    address: "Shop 12, SV Road, Jogeshwari West, Mumbai 400102",
    latitude: 19.1383,
    longitude: 72.8303,
    status: "assigned",
    type: "delivery",
    items: [{ name: "Full Cream Milk 1L", quantity: 50, weight: 50 }, { name: "Toned Milk 500ml", quantity: 30, weight: 15 }],
    total_weight: 65,
    total_amount: 3250,
    payment_type: "cod",
    delivery_window_start: "06:00",
    delivery_window_end: "07:00",
    notes: "Leave at door if closed",
    sequence: 1,
  },
  {
    id: "order-2",
    order_number: "RP-2024-002",
    customer_name: "Patel Kirana",
    customer_phone: "919876543211",
    address: "Main Road, Goregaon East, Mumbai 400063",
    latitude: 19.1667,
    longitude: 72.8562,
    status: "assigned",
    type: "delivery",
    items: [{ name: "Bread Loaves", quantity: 100, weight: 40 }, { name: "Butter Packets 200g", quantity: 50, weight: 10 }],
    total_weight: 50,
    total_amount: 4500,
    payment_type: "prepaid",
    delivery_window_start: "06:30",
    delivery_window_end: "07:30",
    notes: "Call on arrival",
    sequence: 2,
  },
  {
    id: "order-3",
    order_number: "RP-2024-003",
    customer_name: "Gupta Pharmacy",
    customer_phone: "919876543212",
    address: "Link Road, Malad West, Mumbai 400064",
    latitude: 19.1889,
    longitude: 72.8479,
    status: "picked_up",
    type: "delivery",
    items: [{ name: "Paracetamol 500mg", quantity: 200, weight: 5 }, { name: "Vitamin D3", quantity: 50, weight: 3 }],
    total_weight: 8,
    total_amount: 12000,
    payment_type: "prepaid",
    delivery_window_start: "06:45",
    delivery_window_end: "07:45",
    notes: "Urgent - temperature sensitive",
    sequence: 3,
  },
];

const STATS = {
  todayEarnings: 1250,
  totalEarnings: 45800,
  thisWeek: 8900,
  thisMonth: 35200,
  ordersCompleted: 127,
  acceptanceRate: 98,
  rating: 4.8,
};

function StatusBadge({ status }: { status: Order["status"] }) {
  const lang = useDriverStore((s) => s.language);
  const colors: Record<Order["status"], string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    assigned: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    picked_up: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    delivered: "bg-green-500/20 text-green-400 border-green-500/30",
    cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
    failed: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  };
  const labels: Record<Order["status"], TranslationKey> = {
    pending: "pending",
    assigned: "assigned",
    picked_up: "inProgress",
    delivered: "completed",
    cancelled: "cancelled",
    failed: "failed",
  } as const;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status]}`}>
      {t(labels[status], lang)}
    </span>
  );
}

function OrderCard({ order, onAction }: { order: Order; onAction: (action: string, orderId: string) => void }) {
  const lang = useDriverStore((s) => s.language);
  const isPickedUp = order.status === "picked_up";
  const isDelivered = order.status === "delivered";
  const isFailed = order.status === "failed";
  const isCancelled = order.status === "cancelled";

  return (
    <div className="glass p-4 border-border/50 relative overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-sm font-medium text-amber-400">{order.order_number}</span>
            <StatusBadge status={order.status} />
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${order.type === "pickup" ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"}`}>
              {t(order.type, lang)}
            </span>
          </div>
          <h3 className="font-medium text-foreground mb-1 truncate">{order.customer_name}</h3>
          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {order.address}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
            <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {order.items.length} {t("items", lang)}</span>
            <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {order.total_weight} kg</span>
            <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" /> ₹{order.total_amount}</span>
            <span className={`flex items-center gap-1 ${order.payment_type === "cod" ? "text-amber-400" : "text-green-400"}`}>
              {order.payment_type === "cod" ? <DollarSign className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
              {t(order.payment_type, lang)}
            </span>
          </div>
          {order.delivery_window_start && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> {t("deliveryWindowStart", lang)}: {order.delivery_window_start} - {order.delivery_window_end}
            </p>
          )}
          {order.notes && (
            <p className="text-sm text-amber-400 flex items-center gap-1 mt-1">
              <Info className="w-3 h-3" /> {order.notes}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAction("navigate", order.id)}
              className="btn-outline btn-sm px-3 py-1.5 gap-1"
              disabled={isDelivered || isFailed || isCancelled}
            >
              <Navigation className="w-4 h-4" /> {t("navigate", lang)}
            </button>
            <button
              onClick={() => onAction("call", order.id)}
              className="btn-ghost btn-sm p-2"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => onAction("message", order.id)}
              className="btn-ghost btn-sm p-2"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col gap-1.5 w-full">
            {!isPickedUp && !isDelivered && !isFailed && !isCancelled && (
              <button
                onClick={() => onAction("pickup", order.id)}
                className="btn-primary w-full py-2 gap-2"
              >
                <PackageCheck className="w-4 h-4" /> {t("markPickedUp", lang)}
              </button>
            )}
            {isPickedUp && !isDelivered && !isFailed && !isCancelled && (
              <button
                onClick={() => onAction("deliver", order.id)}
                className="btn-primary w-full py-2 gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" /> {t("markDelivered", lang)}
              </button>
            )}
            {(!isDelivered && !isFailed && !isCancelled) && (
              <button
                onClick={() => onAction("fail", order.id)}
                className="btn-outline w-full py-2 gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <XCircle className="w-4 h-4" /> {t("markFailed", lang)}
              </button>
            )}
            {(isDelivered || isFailed || isCancelled) && (
              <span className="text-xs text-muted-foreground text-center px-2 py-1">
                {isDelivered ? t("delivered", lang) : isFailed ? t("failed", lang) : t("cancelled", lang)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RouteCard({ route, isActive, onStart, onComplete }: { route: Route; isActive: boolean; onStart: () => void; onComplete: () => void }) {
  const lang = useDriverStore((s) => s.language);
  const customerStops = route.stops.filter((s) => s.locationId !== "depot");
  
  return (
    <div className={`glass p-4 border-border/50 ${isActive ? "border-amber-500/30 bg-amber-500/5" : ""}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <h3 className="font-display text-lg font-bold text-foreground mb-1">{route.name}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {new Date(route.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            route.status === "active" ? "bg-green-500/20 text-green-400" :
            route.status === "completed" ? "bg-blue-500/20 text-blue-400" :
            "bg-amber-500/20 text-amber-400"
          }`}>
            {t(route.status as TranslationKey, lang)}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 bg-background/50 rounded-lg">
          <div className="font-display text-xl font-bold text-amber-400">{route.totalDistanceKm.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">{t("totalDistance", lang)} (km)</div>
        </div>
        <div className="text-center p-2 bg-background/50 rounded-lg">
          <div className="font-display text-xl font-bold text-amber-400">{route.totalDurationMin}</div>
          <div className="text-xs text-muted-foreground">{t("estimatedTime", lang)} (min)</div>
        </div>
        <div className="text-center p-2 bg-background/50 rounded-lg">
          <div className="font-display text-xl font-bold text-amber-400">{customerStops.length}</div>
          <div className="text-xs text-muted-foreground">{t("stops", lang)}</div>
        </div>
      </div>

      <div className="space-y-1.5 mb-4 max-h-48 overflow-y-auto">
        {customerStops.map((stop, idx) => (
          <div key={stop.locationId} className="flex items-center gap-3 text-sm p-2 bg-background/30 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold flex-shrink-0">
              {stop.sequence}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{stop.locationName}</p>
              <p className="text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {stop.arrivalTime} - {stop.departureTime}
              </p>
            </div>
            <div className="text-right text-muted-foreground text-xs">
              <div>+{stop.distanceFromPreviousKm.toFixed(1)} km</div>
              <div>+{stop.durationFromPreviousMin} min</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {route.status === "planned" && (
          <button onClick={onStart} className="btn-primary flex-1 gap-2">
            <Flag className="w-4 h-4" /> {t("startRoute", lang)}
          </button>
        )}
        {route.status === "active" && (
          <button onClick={onComplete} className="btn-primary flex-1 gap-2 bg-green-600 hover:bg-green-700">
            <FlagTriangleRight className="w-4 h-4" /> {t("completeRoute", lang)}
          </button>
        )}
        {route.status === "completed" && (
          <button className="btn-outline flex-1" disabled>
            <CheckCircle className="w-4 h-4" /> {t("completed", lang)}
          </button>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend }: { icon: React.ElementType; label: string; value: string | number; trend?: string }) {
  return (
    <div className="glass p-4 border-border/50">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 text-amber-400" />
        {trend && <span className="text-xs text-green-400 flex items-center gap-1"><ArrowRight className="w-3 h-3" /> {trend}</span>}
      </div>
      <div className="font-display text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Header() {
  const { isOnline, setOnline, language, setLanguage } = useDriverStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const lang = language;
  const tLang = (key: TranslationKey) => t(key, lang);

  const handleOnlineToggle = () => {
    if (!isOnline) {
      // Request GPS permission
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => setOnline(true),
          () => {
            alert(tLang("gpsStatus") + " permission required");
            setOnline(true);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        setOnline(true);
      }
    } else {
      setOnline(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass-strong border-b border-border/50">
      <div className="mx-auto max-w-screen-xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Menu + Title */}
          <div className="flex items-center gap-3">
            <button onClick={() => setShowMenu(!showMenu)} className="btn-ghost p-2 lg:hidden">
              {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl gradient-gold flex items-center justify-center">
                <Truck className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-foreground hidden sm:block">{tLang("appTitle")}</span>
            </div>
          </div>

          {/* Center: Online Toggle */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={handleOnlineToggle}
              className={`btn gap-2 px-4 py-1.5 ${isOnline ? "bg-green-600 hover:bg-green-700" : "btn-outline"}`}
            >
              <Wifi className="w-4 h-4" />
              {isOnline ? tLang("online") : tLang("offline")}
            </button>
          </div>

          {/* Right: Language + Notifications + Profile */}
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLanguage(!showLanguage)}
                className="btn-ghost p-2 rounded-lg"
              >
                {lang === "en" ? "EN" : "हि"}
                <ChevronDown className="w-3 h-3 ml-1" />
              </button>
              {showLanguage && (
                <div className="absolute right-0 top-full mt-2 glass-strong rounded-lg border border-border/50 p-2 min-w-[120px] z-50">
                  <button onClick={() => { setLanguage("en"); setShowLanguage(false); }} className="w-full px-3 py-2 text-left rounded hover:bg-accent">
                    {tLang("english")}
                  </button>
                  <button onClick={() => { setLanguage("hi"); setShowLanguage(false); }} className="w-full px-3 py-2 text-left rounded hover:bg-accent">
                    {tLang("hindi")}
                  </button>
                </div>
              )}
            </div>

            {/* Notifications */}
            <button className="btn-ghost p-2 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="btn-ghost p-1.5 rounded-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-amber-400" />
                </div>
                <span className="hidden sm:block text-sm font-medium">Driver</span>
                <ChevronDown className="w-3 h-3 hidden sm:block" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 glass-strong rounded-lg border border-border/50 p-2 min-w-[180px] z-50">
                  <button className="w-full px-3 py-2 text-left rounded hover:bg-accent flex items-center gap-2">
                    <User className="w-4 h-4" /> {tLang("profile")}
                  </button>
                  <button className="w-full px-3 py-2 text-left rounded hover:bg-accent flex items-center gap-2">
                    <Settings className="w-4 h-4" /> {tLang("settings")}
                  </button>
                  <button className="w-full px-3 py-2 text-left rounded hover:bg-accent flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" /> {tLang("help")}
                  </button>
                  <hr className="border-border/50 my-2" />
                  <button className="w-full px-3 py-2 text-left rounded hover:bg-accent flex items-center gap-2 text-red-400" onClick={() => { setOnline(false); setShowMenu(false); }}>
                    <LogOut className="w-4 h-4" /> {tLang("logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMenu && (
        <div className="lg:hidden glass-strong border-t border-border/50 px-4 py-4 space-y-3">
          <button onClick={handleOnlineToggle} className={`btn w-full gap-2 justify-center ${isOnline ? "bg-green-600 hover:bg-green-700" : "btn-outline"}`}>
            <Wifi className="w-4 h-4" /> {isOnline ? tLang("goOffline") : tLang("goOnline")}
          </button>
          <a href="/driver/routes" className="btn-outline w-full justify-center gap-2"><Route className="w-4 h-4" /> {tLang("routes")}</a>
          <a href="/driver/orders" className="btn-outline w-full justify-center gap-2"><Package className="w-4 h-4" /> {tLang("orders")}</a>
          <a href="/driver/earnings" className="btn-outline w-full justify-center gap-2"><IndianRupee className="w-4 h-4" /> {tLang("earnings")}</a>
          <button className="btn-outline w-full justify-center gap-2 text-red-400 border-red-500/30" onClick={() => { setOnline(false); setShowMenu(false); }}>
            <LogOut className="w-4 h-4" /> {tLang("logout")}
          </button>
        </div>
      )}
    </header>
  );
}

function BottomNav() {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/driver";
  const lang = useDriverStore((s) => s.language);
  const tLang = (key: TranslationKey) => t(key, lang);

  const navItems = [
    { href: "/driver", icon: Home, label: tLang("dashboard") },
    { href: "/driver/routes", icon: Route, label: tLang("routes") },
    { href: "/driver/orders", icon: Package, label: tLang("orders") },
    { href: "/driver/earnings", icon: IndianRupee, label: tLang("earnings") },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-border/50 lg:hidden">
      <div className="grid grid-cols-4">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 py-3 px-2 ${pathname === item.href || (item.href !== "/driver" && pathname.startsWith(item.href)) ? "text-amber-400" : "text-muted-foreground"}`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs">{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}

export default function DriverDashboard() {
  const lang = useDriverStore((s) => s.language);
  const tLang = (key: TranslationKey) => t(key, lang);
  const { isOnline, currentRouteId, setRoute, orders: localOrders } = useDriverStore();
  const [activeTab, setActiveTab] = useState<"dashboard" | "routes" | "orders" | "earnings">("dashboard");
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [networkOnline, setNetworkOnline] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(100);

  // Simulate GPS and network status
  useEffect(() => {
    const handleOnline = () => setNetworkOnline(true);
    const handleOffline = () => setNetworkOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    queueMicrotask(() => setNetworkOnline(navigator.onLine));

    // Battery API
    if ("getBattery" in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener("levelchange", () => setBatteryLevel(Math.round(battery.level * 100)));
      });
    }

    // GPS
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => setGpsEnabled(true),
        () => setGpsEnabled(false),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    // Simulate API sync
    await new Promise((r) => setTimeout(r, 1500));
    setLastSync(new Date());
    setIsSyncing(false);
  }, []);

  const handleOrderAction = useCallback((action: string, orderId: string) => {
    // In real app: call API, update local state, queue for sync
    console.log(`Action: ${action} for order ${orderId}`);
    if (action === "navigate") {
      const order = MOCK_ORDERS.find((o) => o.id === orderId);
      if (order) {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${order.latitude},${order.longitude}`;
        window.open(url, "_blank");
      }
    } else if (action === "call") {
      const order = MOCK_ORDERS.find((o) => o.id === orderId);
      if (order) window.open(`tel:${order.customer_phone}`, "_self");
    } else if (action === "message") {
      const order = MOCK_ORDERS.find((o) => o.id === orderId);
      if (order) window.open(`https://wa.me/${order.customer_phone}`, "_blank");
    }
    // For pickup/deliver/fail: update local state, queue for background sync
  }, []);

  const handleRouteAction = useCallback((action: "start" | "complete", routeId: string) => {
    if (action === "start") {
      setRoute(routeId);
      alert(tLang("routeStarted"));
    } else {
      setRoute(null);
      alert(tLang("routeCompleted"));
    }
  }, [setRoute, tLang]);

  // Merge mock orders with local state
  const allOrders: Order[] = [...MOCK_ORDERS, ...localOrders.filter((o) => !MOCK_ORDERS.some((m) => m.id === o.id))] as Order[];

  if (activeTab === "dashboard") {
    return (
      <div className="pt-16 pb-24 lg:pb-0 min-h-screen">
        <Header />
        <main className="mx-auto max-w-screen-xl px-4 py-6 space-y-6">
          {/* Status Bar */}
          <div className="glass p-4 border-border/50 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 p-2 rounded-lg ${isOnline ? "bg-green-500/10" : "bg-red-500/10"}`}>
                <div className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
                <span className="font-medium">{isOnline ? tLang("online") : tLang("offline")}</span>
              </div>
              {currentRouteId && (
                <div className="flex items-center gap-2 p-2 bg-amber-500/10 rounded-lg">
                  <Flag className="w-4 h-4 text-amber-400" />
                  <span className="font-medium text-amber-400">{tLang("currentRoute")}: {currentRouteId}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                {gpsEnabled ? <Satellite className="w-4 h-4 text-green-400" /> : <SatelliteDish className="w-4 h-4 text-red-400" />}
                <span>{tLang("gpsStatus")}</span>
              </div>
              <div className="flex items-center gap-1">
                {networkOnline ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
                <span>{tLang("networkStatus")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Battery className="w-4 h-4" />
                <span>{batteryLevel}%</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={IndianRupee} label={tLang("todayEarnings")} value={`₹${STATS.todayEarnings.toLocaleString()}`} trend="+12%" />
            <StatCard icon={PackageCheck} label={tLang("ordersCompleted")} value={STATS.ordersCompleted} trend="+5 today" />
            <StatCard icon={Star} label={tLang("rating")} value={STATS.rating} />
            <StatCard icon={Target} label={tLang("acceptanceRate")} value={`${STATS.acceptanceRate}%`} />
          </div>

          {/* Current Route */}
          {currentRouteId ? (
            <div>
              <h2 className="font-display text-xl font-bold mb-4">{tLang("currentRoute")}</h2>
              {MOCK_ROUTES.filter((r) => r.id === currentRouteId).map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  isActive={true}
                  onStart={() => handleRouteAction("start", route.id)}
                  onComplete={() => handleRouteAction("complete", route.id)}
                />
              ))}
            </div>
          ) : (
            <div className="glass p-6 border-border/50 text-center">
              <Truck className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-display text-lg font-bold mb-2">{tLang("noActiveRoute")}</h3>
              <p className="text-muted-foreground mb-4">{tLang("tapStartRoute") || "Start a route from the Routes tab to begin"}</p>
              <a href="/driver/routes" className="btn-primary inline-flex gap-2">
                <Flag className="w-4 h-4" /> {tLang("startRoute")}
              </a>
            </div>
          )}

          {/* Upcoming Routes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold">{tLang("upcomingRoutes")}</h2>
              <button onClick={handleSync} disabled={isSyncing} className="btn-ghost btn-sm gap-1">
                <FolderSync className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? tLang("sync") : tLang("refresh")}
              </button>
            </div>
            <div className="space-y-3">
              {MOCK_ROUTES.filter((r) => r.status === "planned" && r.id !== currentRouteId).map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  isActive={false}
                  onStart={() => handleRouteAction("start", route.id)}
                  onComplete={() => handleRouteAction("complete", route.id)}
                />
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <a href="/driver/routes" className="glass p-4 border-border/50 text-center hover:border-amber-500/30 transition-colors">
              <Route className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <div className="font-medium">{tLang("routes")}</div>
              <div className="text-xs text-muted-foreground">{MOCK_ROUTES.length} routes</div>
            </a>
            <a href="/driver/orders" className="glass p-4 border-border/50 text-center hover:border-amber-500/30 transition-colors">
              <Package className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <div className="font-medium">{tLang("orders")}</div>
              <div className="text-xs text-muted-foreground">{allOrders.length} orders</div>
            </a>
            <a href="/driver/earnings" className="glass p-4 border-border/50 text-center hover:border-amber-500/30 transition-colors">
              <IndianRupee className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <div className="font-medium">{tLang("earnings")}</div>
              <div className="text-xs text-muted-foreground">₹{STATS.todayEarnings.toLocaleString()} today</div>
            </a>
            <button onClick={handleSync} disabled={isSyncing} className="glass p-4 border-border/50 text-center hover:border-amber-500/30 transition-colors flex flex-col items-center gap-2">
              <FolderSync className={`w-8 h-8 text-amber-400 ${isSyncing ? "animate-spin" : ""}`} />
              <div className="font-medium">{tLang("sync")}</div>
              <div className="text-xs text-muted-foreground">
                {lastSync ? `Last: ${lastSync.toLocaleTimeString()}` : tLang("never")}
              </div>
            </button>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (activeTab === "routes") {
    return (
      <div className="pt-16 pb-24 lg:pb-0 min-h-screen">
        <Header />
        <main className="mx-auto max-w-screen-xl px-4 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-bold">{tLang("routes")}</h1>
            <button onClick={handleSync} disabled={isSyncing} className="btn-outline btn-sm gap-1">
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              {tLang("refresh")}
            </button>
          </div>

          {/* Active Route */}
          {currentRouteId && MOCK_ROUTES.filter((r) => r.id === currentRouteId).map((route) => (
            <div key={route.id} className="space-y-4">
              <h2 className="font-display text-lg font-bold text-amber-400">{tLang("currentRoute")}</h2>
              <RouteCard
                route={route}
                isActive={true}
                onStart={() => handleRouteAction("start", route.id)}
                onComplete={() => handleRouteAction("complete", route.id)}
              />
            </div>
          ))}

          {/* Upcoming */}
          <div>
            <h2 className="font-display text-lg font-bold mb-4">{tLang("upcomingRoutes")}</h2>
            <div className="space-y-3">
              {MOCK_ROUTES.filter((r) => r.status === "planned" && r.id !== currentRouteId).map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  isActive={false}
                  onStart={() => handleRouteAction("start", route.id)}
                  onComplete={() => handleRouteAction("complete", route.id)}
                />
              ))}
            </div>
          </div>

          {/* Completed */}
          <div>
            <h2 className="font-display text-lg font-bold mb-4">{tLang("completedRoutes")}</h2>
            <div className="space-y-3">
              {MOCK_ROUTES.filter((r) => r.status === "completed").map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  isActive={false}
                  onStart={() => {}}
                  onComplete={() => {}}
                />
              ))}
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (activeTab === "orders") {
    const groupedOrders = allOrders.reduce((acc: Record<Order["status"], Order[]>, order) => {
      const key: Order["status"] = order.status;
      if (!acc[key]) acc[key] = [];
      acc[key].push(order);
      return acc;
    }, {} as Record<Order["status"], Order[]>);

    const statusOrder: Order["status"][] = ["assigned", "picked_up", "pending", "delivered", "failed", "cancelled"];

    return (
      <div className="pt-16 pb-24 lg:pb-0 min-h-screen">
        <Header />
        <main className="mx-auto max-w-screen-xl px-4 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-bold">{tLang("orders")}</h1>
            <button onClick={handleSync} disabled={isSyncing} className="btn-outline btn-sm gap-1">
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              {tLang("refresh")}
            </button>
          </div>

          {statusOrder.map((status) => {
            const orders = groupedOrders[status] || [];
            if (!orders.length) return null;
            return (
              <div key={status} className="space-y-3">
                <h2 className="font-display text-lg font-bold flex items-center gap-2">
                  <StatusBadge status={status} />
                  <span>{t(status as TranslationKey, lang)}</span>
                  <span className="text-sm text-muted-foreground">({orders.length})</span>
                </h2>
                <div className="space-y-3">
                  {orders.map((order) => (
                    <OrderCard key={order.id} order={order} onAction={handleOrderAction} />
                  ))}
                </div>
              </div>
            );
          })}
          
          {allOrders.length === 0 && (
            <div className="glass p-8 border-border/50 text-center">
              <Package className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-display text-lg font-bold mb-2">{tLang("noOrders")}</h3>
              <p className="text-muted-foreground">{tLang("tapForDetails")}</p>
            </div>
          )}
        </main>
        <BottomNav />
      </div>
    );
  }

  if (activeTab === "earnings") {
    return (
      <div className="pt-16 pb-24 lg:pb-0 min-h-screen">
        <Header />
        <main className="mx-auto max-w-screen-xl px-4 py-6 space-y-6">
          <h1 className="font-display text-2xl font-bold">{tLang("earnings")}</h1>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={IndianRupee} label={tLang("todayEarnings")} value={`₹${STATS.todayEarnings.toLocaleString()}`} trend="+12%" />
            <StatCard icon={Calendar} label={tLang("thisWeek")} value={`₹${STATS.thisWeek.toLocaleString()}`} />
            <StatCard icon={Calendar} label={tLang("thisMonth")} value={`₹${STATS.thisMonth.toLocaleString()}`} />
            <StatCard icon={BarChart2} label={tLang("totalEarnings")} value={`₹${STATS.totalEarnings.toLocaleString()}`} />
          </div>

          <div className="glass p-4 border-border/50">
            <h2 className="font-display text-lg font-bold mb-4">{tLang("ordersCompleted")}: {STATS.ordersCompleted}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">{tLang("acceptanceRate")}</div>
                <div className="font-display text-2xl font-bold text-amber-400">{STATS.acceptanceRate}%</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{tLang("rating")}</div>
                <div className="font-display text-2xl font-bold text-amber-400 flex items-center gap-1">
                  {STATS.rating} <Star className="w-5 h-5 fill-current" />
                </div>
              </div>
            </div>
          </div>

          <div className="glass p-4 border-border/50">
            <h2 className="font-display text-lg font-bold mb-4">Earnings Breakdown</h2>
            <div className="space-y-3">
              {["Base Pay", "Tips", "Bonuses", "Incentives"].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground">{item}</span>
                  <span className="font-medium">₹{(STATS.todayEarnings * [0.7, 0.15, 0.1, 0.05][i]).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return null;
}