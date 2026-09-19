"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Package,
  MapPin,
  Clock,
  IndianRupee,
  DollarSign,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Home,
  List,
  PackageCheck,
  Calendar,
  Phone,
  MessageSquare,
  Navigation,
  MoreVertical,
  Eye,
  User,
  Activity,
} from "lucide-react";
import { useDriverStore } from "../store";
import { cn } from "@routeplan/ui";
import { Button } from "@routeplan/ui";

const TRANSLATIONS = {
  en: {
    orders: "Orders",
    allOrders: "All Orders",
    pending: "Pending",
    assigned: "Assigned",
    pickedUp: "Picked Up",
    delivered: "Delivered",
    cancelled: "Cancelled",
    failed: "Failed",
    pickup: "Pickup",
    delivery: "Delivery",
    noOrders: "No orders found",
    noOrdersDesc: "You don't have any orders matching the current filter.",
    customer: "Customer",
    address: "Address",
    contact: "Contact",
    items: "Items",
    weight: "Weight",
    amount: "Amount",
    cod: "COD",
    prepaid: "Prepaid",
    deliveryWindow: "Delivery Window",
    notes: "Notes",
    markPickedUp: "Mark Picked Up",
    markDelivered: "Mark Delivered",
    markFailed: "Mark Failed",
    reason: "Reason",
    submit: "Submit",
    cancel: "Cancel",
    confirm: "Confirm",
    orderPickedUp: "Order marked as picked up",
    orderDelivered: "Order marked as delivered",
    orderFailed: "Order marked as failed",
    confirmPickedUp: "Mark this order as picked up?",
    confirmDelivered: "Mark this order as delivered?",
    confirmFailed: "Mark this order as failed?",
    failedReason: "Reason for failure",
    failedReasonPlaceholder: "Customer not available, address issue, etc.",
    pullToRefresh: "Pull to refresh",
    loading: "Loading...",
    error: "Error loading orders",
    retry: "Retry",
    searchPlaceholder: "Search orders...",
    filter: "Filter",
    status: "Status",
    type: "Type",
    sequence: "Sequence",
    today: "Today",
    thisWeek: "This Week",
    allTime: "All Time",
    timeFilter: "Time Filter",
    dashboard: "Dashboard",
    routes: "My Routes",
    earnings: "Earnings",
    profile: "Profile",
  },
  hi: {
    orders: "ऑर्डर",
    allOrders: "सभी ऑर्डर",
    pending: "लंबित",
    assigned: "असाइन किया गया",
    pickedUp: "पिकअप हुआ",
    delivered: "डिलीवर",
    cancelled: "रद्द",
    failed: "विफल",
    pickup: "पिकअप",
    delivery: "डिलीवरी",
    noOrders: "कोई ऑर्डर नहीं मिला",
    noOrdersDesc: "वर्तमान फ़िल्टर से मेल खाने वाला कोई ऑर्डर नहीं है।",
    customer: "ग्राहक",
    address: "पता",
    contact: "संपर्क",
    items: "आइटम",
    weight: "वजन",
    amount: "राशि",
    cod: "कैश ऑन डिलीवरी",
    prepaid: "प्रीपेड",
    deliveryWindow: "डिलीवरी विंडो",
    notes: "नोट्स",
    markPickedUp: "पिकअप चिह्नित करें",
    markDelivered: "डिलीवर चिह्नित करें",
    markFailed: "विफल चिह्नित करें",
    reason: "कारण",
    submit: "जमा करें",
    cancel: "रद्द करें",
    confirm: "पुष्टि करें",
    orderPickedUp: "ऑर्डर पिकअप के रूप में चिह्नित",
    orderDelivered: "ऑर्डर डिलीवर के रूप में चिह्नित",
    orderFailed: "ऑर्डर विफल के रूप में चिह्नित",
    confirmPickedUp: "इस ऑर्डर को पिकअप के रूप में चिह्नित करें?",
    confirmDelivered: "इस ऑर्डर को डिलीवर के रूप में चिह्नित करें?",
    confirmFailed: "इस ऑर्डर को विफल के रूप में चिह्नित करें?",
    failedReason: "विफलता का कारण",
    failedReasonPlaceholder: "ग्राहक उपलब्ध नहीं, पता समस्या, आदि।",
    pullToRefresh: "रीफ्रेश करने के लिए खींचें",
    loading: "लोड हो रहा है...",
    error: "ऑर्डर लोड करने में त्रुटि",
    retry: "पुनः प्रयास",
    searchPlaceholder: "ऑर्डर खोजें...",
    filter: "फ़िल्टर",
    status: "स्थिति",
    type: "प्रकार",
    sequence: "क्रम",
    today: "आज",
    thisWeek: "इस सप्ताह",
    allTime: "सभी समय",
    timeFilter: "समय फ़िल्टर",
    dashboard: "डैशबोर्ड",
    routes: "मेरे रूट",
    earnings: "कमाई",
    profile: "प्रोफाइल",
  },
};

type Language = "en" | "hi";
type TranslationKey = keyof typeof TRANSLATIONS.en;

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

function t(key: TranslationKey, lang: Language): string {
  return TRANSLATIONS[lang][key] || TRANSLATIONS.en[key];
}

function getStatusColor(status: Order["status"]): string {
  switch (status) {
    case "pending":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "assigned":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "picked_up":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "delivered":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "cancelled":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "failed":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  }
}

function getStatusLabel(status: Order["status"], lang: Language): string {
  const labels: Record<Order["status"], TranslationKey> = {
    pending: "pending",
    assigned: "assigned",
    picked_up: "pickedUp",
    delivered: "delivered",
    cancelled: "cancelled",
    failed: "failed",
  };
  return t(labels[status], lang);
}

const statusOptions = ["all", "pending", "assigned", "picked_up", "delivered", "cancelled", "failed"] as const;
type StatusFilter = typeof statusOptions[number];

function statusToTranslationKey(status: StatusFilter): TranslationKey {
  const map: Record<StatusFilter, TranslationKey> = {
    all: "allOrders",
    pending: "pending",
    assigned: "assigned",
    picked_up: "pickedUp",
    delivered: "delivered",
    cancelled: "cancelled",
    failed: "failed",
  };
  return map[status];
}

const typeOptions = ["all", "pickup", "delivery"] as const;
type TypeFilter = typeof typeOptions[number];

const timeOptions = ["today", "thisWeek", "allTime"] as const;
type TimeFilter = typeof timeOptions[number];

export default function DriverOrdersPage() {
  const { language } = useDriverStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState<{ order: Order; action: "picked_up" | "delivered" | "failed" } | null>(null);
  const [failedReason, setFailedReason] = useState("");

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Mock data - in production fetch from API
      const mockOrders: Order[] = [
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
        {
          id: "order-4",
          order_number: "RP-2024-004",
          customer_name: "Singh Bakery",
          customer_phone: "919876543213",
          address: "Station Road, Kandivali East, Mumbai 400101",
          latitude: 19.2100,
          longitude: 72.8700,
          status: "delivered",
          type: "delivery",
          items: [{ name: "Croissants", quantity: 60, weight: 12 }, { name: "Danish Pastries", quantity: 40, weight: 10 }],
          total_weight: 22,
          total_amount: 5500,
          payment_type: "cod",
          delivery_window_start: "07:00",
          delivery_window_end: "08:00",
          notes: "",
          sequence: 4,
        },
        {
          id: "order-5",
          order_number: "RP-2024-005",
          customer_name: "Mumbai Medical",
          customer_phone: "919876543214",
          address: "Khar West, Mumbai 400052",
          latitude: 19.0700,
          longitude: 72.8200,
          status: "pending",
          type: "pickup",
          items: [{ name: "Medical Supplies Return", quantity: 10, weight: 5 }],
          total_weight: 5,
          total_amount: 0,
          payment_type: "prepaid",
          delivery_window_start: "10:00",
          delivery_window_end: "11:00",
          notes: "Return expired medicines",
          sequence: 1,
        },
      ];
      setOrders(mockOrders);
    } catch (err) {
      setError(t("error", language));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [language]);

  useEffect(() => {
    queueMicrotask(() => loadOrders());
  }, [loadOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = searchQuery === "" ||
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesType = typeFilter === "all" || order.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleAction = (action: "picked_up" | "delivered" | "failed", order: Order) => {
    setShowActionModal({ order, action });
    setFailedReason("");
  };

  const handleConfirmAction = async () => {
    if (!showActionModal) return;
    
    const { order, action } = showActionModal;
    
    try {
      // In production: await fetch("/api/driver/orders/action", { method: "POST", body: JSON.stringify({ orderId: order.id, action, reason: failedReason }) });
      
      setOrders(prev => prev.map(o => 
        o.id === order.id ? { ...o, status: action } : o
      ));
      
      const messages: Record<string, TranslationKey> = {
        picked_up: "orderPickedUp",
        delivered: "orderDelivered",
        failed: "orderFailed",
      };
      alert(t(messages[action], language));
    } catch (err) {
      alert("Failed to update order");
    } finally {
      setShowActionModal(null);
      setFailedReason("");
    }
  };

  const handleNavigate = (order: Order) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const url = `https://www.google.com/maps/dir/?api=1&origin=${pos.coords.latitude},${pos.coords.longitude}&destination=${order.latitude},${order.longitude}&travelmode=driving`;
        window.open(url, "_blank");
      });
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`;
      window.open(url, "_blank");
    }
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`);
  };

  const handleMessage = (phone: string) => {
    window.open(`https://wa.me/${phone}`);
  };

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
              <h1 className="text-xl font-semibold text-foreground">{t("orders", language)}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowFilterModal(true)}>
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("searchPlaceholder", language)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 glass rounded-xl border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </header>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilterModal(false)} />
          <div className="relative glass-strong rounded-2xl p-6 w-full max-w-sm animate-slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">{t("filter", language)}</h2>
              <button className="btn-ghost p-2" onClick={() => setShowFilterModal(false)}>
                <ChevronRight className="w-5 h-5 rotate-90" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3">{t("status", language)}</label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                        statusFilter === status
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border/50"
                      )}
                    >
                      {t(statusToTranslationKey(status), language)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3">{t("type", language)}</label>
                <div className="flex flex-wrap gap-2">
                  {typeOptions.map((type) => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                        typeFilter === type
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border/50"
                      )}
                    >
                      {t(type === "all" ? "allOrders" : type, language)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-3">{t("timeFilter", language)}</label>
                <div className="flex flex-wrap gap-2">
                  {timeOptions.map((time) => (
                    <button
                      key={time}
                      onClick={() => setTimeFilter(time)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                        timeFilter === time
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border/50"
                      )}
                    >
                      {t(time, language)}
                    </button>
                  ))}
                </div>
              </div>
              
              <Button className="w-full" onClick={() => setShowFilterModal(false)}>
                {t("confirm", language)}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowActionModal(null)} />
          <div className="relative glass-strong rounded-2xl p-6 w-full max-w-sm animate-slide-up">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {showActionModal.action === "picked_up" && t("confirmPickedUp", language)}
              {showActionModal.action === "delivered" && t("confirmDelivered", language)}
              {showActionModal.action === "failed" && t("confirmFailed", language)}
            </h3>
            {showActionModal.action === "failed" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-muted-foreground mb-2">{t("failedReason", language)}</label>
                <textarea
                  value={failedReason}
                  onChange={(e) => setFailedReason(e.target.value)}
                  placeholder={t("failedReasonPlaceholder", language)}
                  rows={3}
                  className="w-full glass rounded-xl border border-border/50 p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowActionModal(null)}>
                {t("cancel", language)}
              </Button>
              <Button className="flex-1" onClick={handleConfirmAction}>
                {t("submit", language)}
              </Button>
            </div>
          </div>
        </div>
      )}

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
        ) : filteredOrders.length === 0 ? (
          <div className="glass p-8 rounded-2xl text-center">
            <Package className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">{t("noOrders", language)}</h2>
            <p className="text-muted-foreground mb-6">{t("noOrdersDesc", language)}</p>
            <Button onClick={handleRefresh} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" /> {t("retry", language)}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onAction={handleAction}
                onNavigate={handleNavigate}
                onCall={handleCall}
                onMessage={handleMessage}
                language={language}
              />
            ))}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass-strong border-t border-border/50 backdrop-blur-xl">
        <div className="grid grid-cols-5">
          <NavItem href="/driver" icon={<Home className="w-5 h-5" />} label={t("dashboard", language)} active={false} />
          <NavItem href="/driver/routes" icon={<List className="w-5 h-5" />} label={t("routes", language)} active={false} />
          <NavItem href="/driver/orders" icon={<Package className="w-5 h-5" />} label={t("orders", language)} active={true} />
          <NavItem href="/driver/earnings" icon={<IndianRupee className="w-5 h-5" />} label={t("earnings", language)} active={false} />
          <NavItem href="/driver/profile" icon={<User className="w-5 h-5" />} label={t("profile", language)} active={false} />
        </div>
      </nav>
    </div>
  );
}

function OrderCard({
  order,
  onAction,
  onNavigate,
  onCall,
  onMessage,
  language,
}: {
  order: Order;
  onAction: (action: "picked_up" | "delivered" | "failed", order: Order) => void;
  onNavigate: (order: Order) => void;
  onCall: (phone: string) => void;
  onMessage: (phone: string) => void;
  language: Language;
}) {
  const isPickedUp = order.status === "picked_up";
  const isDelivered = order.status === "delivered";
  const isFailed = order.status === "failed";
  const isCancelled = order.status === "cancelled";
  const isCompleted = isDelivered || isFailed || isCancelled;

  return (
    <div className="glass p-4 border border-border/50 rounded-2xl relative overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-sm font-medium text-amber-400">{order.order_number}</span>
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", getStatusColor(order.status))}>
              {getStatusLabel(order.status, language)}
            </span>
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", order.type === "pickup" ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400")}>
              {t(order.type, language)}
            </span>
          </div>
          <h3 className="font-medium text-foreground mb-1 truncate">{order.customer_name}</h3>
          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {order.address}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
            <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {order.items.length} {t("items", language)}</span>
            <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {order.total_weight} kg</span>
            <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" /> ₹{order.total_amount}</span>
            <span className={cn("flex items-center gap-1", order.payment_type === "cod" ? "text-amber-400" : "text-green-400")}>
              {order.payment_type === "cod" ? <DollarSign className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
              {t(order.payment_type, language)}
            </span>
          </div>
          {order.delivery_window_start && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> {t("deliveryWindow", language)}: {order.delivery_window_start} - {order.delivery_window_end}
            </p>
          )}
          {order.notes && (
            <p className="text-sm text-amber-400 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3" /> {order.notes}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate(order)}
              className="btn-outline btn-sm px-3 py-1.5 gap-1"
              disabled={isCompleted}
            >
              <Navigation className="w-4 h-4" />
            </button>
            <button
              onClick={() => onCall(order.customer_phone)}
              className="btn-ghost btn-sm p-2"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => onMessage(order.customer_phone)}
              className="btn-ghost btn-sm p-2"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
          {!isCompleted && (
            <div className="flex flex-col gap-1 w-full">
              {order.status === "assigned" && (
                <Button size="sm" className="w-full" onClick={() => onAction("picked_up", order)}>
                  <PackageCheck className="w-3 h-3 mr-1" /> {t("markPickedUp", language)}
                </Button>
              )}
              {order.status === "picked_up" && (
                <Button size="sm" className="w-full" onClick={() => onAction("delivered", order)}>
                  <CheckCircle2 className="w-3 h-3 mr-1" /> {t("markDelivered", language)}
                </Button>
              )}
              {(order.status === "assigned" || order.status === "picked_up") && (
                <Button size="sm" variant="outline" className="w-full" onClick={() => onAction("failed", order)}>
                  <XCircle className="w-3 h-3 mr-1" /> {t("markFailed", language)}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
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