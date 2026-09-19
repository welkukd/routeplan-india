"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  CheckCircle2,
  Package,
  Download,
  RefreshCw,
  Loader2,
  Home,
  List,
  User,
  BarChart2,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertCircle,
  Star,
  Zap,
} from "lucide-react";
import { useDriverStore } from "../store";
import { cn } from "@routeplan/ui";
import { Button } from "@routeplan/ui";

const TRANSLATIONS = {
  en: {
    earnings: "Earnings",
    todayEarnings: "Today's Earnings",
    totalEarnings: "Total Earnings",
    thisWeek: "This Week",
    thisMonth: "This Month",
    ordersCompleted: "Orders Completed",
    acceptanceRate: "Acceptance Rate",
    rating: "Rating",
    earningsHistory: "Earnings History",
    noHistory: "No earnings history yet",
    noHistoryDesc: "Complete orders to see your earnings history.",
    date: "Date",
    orders: "Orders",
    amount: "Amount",
    tips: "Tips",
    total: "Total",
    downloadReport: "Download Report",
    refresh: "Refresh",
    loading: "Loading...",
    error: "Error loading earnings",
    retry: "Retry",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    thisYear: "This Year",
    allTime: "All Time",
    avgPerOrder: "Avg/Order",
    avgPerDay: "Avg/Day",
    bestDay: "Best Day",
    bestDayAmount: "Best Day Amount",
    pendingPayout: "Pending Payout",
    lastPayout: "Last Payout",
    payoutSchedule: "Payout Schedule",
    weeklyPayout: "Weekly (Every Monday)",
    instantPayout: "Instant (2% fee)",
    dashboard: "Dashboard",
    routes: "My Routes",
    profile: "Profile",
  },
  hi: {
    earnings: "कमाई",
    todayEarnings: "आज की कमाई",
    totalEarnings: "कुल कमाई",
    thisWeek: "इस सप्ताह",
    thisMonth: "इस महीने",
    ordersCompleted: "पूर्ण ऑर्डर",
    acceptanceRate: "स्वीकृति दर",
    rating: "रेटिंग",
    earningsHistory: "कमाई इतिहास",
    noHistory: "अभी कोई कमाई इतिहास नहीं",
    noHistoryDesc: "इतिहास देखने के लिए ऑर्डर पूरे करें।",
    date: "तारीख",
    orders: "ऑर्डर",
    amount: "राशि",
    tips: "टिप्स",
    total: "कुल",
    downloadReport: "रिपोर्ट डाउनलोड",
    refresh: "रीफ्रेश",
    loading: "लोड हो रहा है...",
    error: "कमाई लोड करने में त्रुटि",
    retry: "पुनः प्रयास",
    daily: "दैनिक",
    weekly: "साप्ताहिक",
    monthly: "मासिक",
    thisYear: "इस वर्ष",
    allTime: "सभी समय",
    avgPerOrder: "औसत/ऑर्डर",
    avgPerDay: "औसत/दिन",
    bestDay: "सर्वश्रेष्ठ दिन",
    bestDayAmount: "सर्वश्रेष्ठ दिन राशि",
    pendingPayout: "लंबित भुगतान",
    lastPayout: "अंतिम भुगतान",
    payoutSchedule: "भुगतान अनुसूची",
    weeklyPayout: "साप्ताहिक (हर सोमवार)",
    instantPayout: "तत्काल (2% शुल्क)",
    dashboard: "डैशबोर्ड",
    routes: "मेरे रूट",
    profile: "प्रोफाइल",
  },
};

type Language = "en" | "hi";
type TranslationKey = keyof typeof TRANSLATIONS.en;

interface EarningsEntry {
  date: string;
  orders: number;
  amount: number;
  tips: number;
  total: number;
}

interface EarningsStats {
  todayEarnings: number;
  totalEarnings: number;
  thisWeek: number;
  thisMonth: number;
  ordersCompleted: number;
  acceptanceRate: number;
  rating: number;
  avgPerOrder: number;
  avgPerDay: number;
  bestDay: string;
  bestDayAmount: number;
  pendingPayout: number;
  lastPayout: string;
}

function t(key: TranslationKey, lang: Language): string {
  return TRANSLATIONS[lang][key] || TRANSLATIONS.en[key];
}

function formatCurrency(amount: number, lang: Language): string {
  return new Intl.NumberFormat(lang === "hi" ? "hi-IN" : "en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string, lang: Language): string {
  return new Date(dateStr).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const timeFilters = ["daily", "weekly", "monthly", "thisYear", "allTime"] as const;
type TimeFilter = typeof timeFilters[number];

export default function DriverEarningsPage() {
  const { language } = useDriverStore();
  const [stats, setStats] = useState<EarningsStats | null>(null);
  const [history, setHistory] = useState<EarningsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("weekly");

  const loadEarnings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data - in production fetch from API
      const mockStats: EarningsStats = {
        todayEarnings: 1250,
        totalEarnings: 45800,
        thisWeek: 8900,
        thisMonth: 35200,
        ordersCompleted: 127,
        acceptanceRate: 98,
        rating: 4.8,
        avgPerOrder: 360,
        avgPerDay: 1480,
        bestDay: "2024-08-15",
        bestDayAmount: 2850,
        pendingPayout: 3200,
        lastPayout: "2024-08-19",
      };
      
      const mockHistory: EarningsEntry[] = [
        { date: "2024-08-21", orders: 12, amount: 1850, tips: 150, total: 2000 },
        { date: "2024-08-20", orders: 10, amount: 1650, tips: 200, total: 1850 },
        { date: "2024-08-19", orders: 14, amount: 2100, tips: 100, total: 2200 },
        { date: "2024-08-18", orders: 8, amount: 1200, tips: 50, total: 1250 },
        { date: "2024-08-17", orders: 11, amount: 1750, tips: 180, total: 1930 },
        { date: "2024-08-16", orders: 9, amount: 1400, tips: 120, total: 1520 },
        { date: "2024-08-15", orders: 15, amount: 2600, tips: 250, total: 2850 },
        { date: "2024-08-14", orders: 7, amount: 1100, tips: 80, total: 1180 },
        { date: "2024-08-13", orders: 10, amount: 1550, tips: 90, total: 1640 },
        { date: "2024-08-12", orders: 13, amount: 1950, tips: 160, total: 2110 },
        { date: "2024-08-11", orders: 6, amount: 950, tips: 40, total: 990 },
        { date: "2024-08-10", orders: 11, amount: 1680, tips: 140, total: 1820 },
        { date: "2024-08-09", orders: 9, amount: 1380, tips: 110, total: 1490 },
        { date: "2024-08-08", orders: 12, amount: 1780, tips: 130, total: 1910 },
      ];
      
      setStats(mockStats);
      setHistory(mockHistory);
    } catch (err) {
      setError(t("error", language));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [language]);

  useEffect(() => {
    queueMicrotask(() => loadEarnings());
  }, [loadEarnings]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadEarnings();
  };

  const filteredHistory = timeFilter === "daily" 
    ? history.slice(0, 7)
    : timeFilter === "weekly"
    ? history.slice(0, 14)
    : timeFilter === "monthly"
    ? history.slice(0, 30)
    : history;

  const totalFiltered = filteredHistory.reduce((sum, entry) => sum + entry.total, 0);
  const avgFiltered = filteredHistory.length > 0 ? totalFiltered / filteredHistory.length : 0;

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
              <h1 className="text-xl font-semibold text-foreground">{t("earnings", language)}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => alert("Report download coming soon")}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
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
        ) : stats && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <StatCard
                icon={<IndianRupee className="w-5 h-5" />}
                label={t("todayEarnings", language)}
                value={formatCurrency(stats.todayEarnings, language)}
                trend={{ value: "+12%", positive: true }}
                color="text-green-400"
                bgColor="bg-green-500/10"
                borderColor="border-green-500/20"
              />
              <StatCard
                icon={<Wallet className="w-5 h-5" />}
                label={t("thisWeek", language)}
                value={formatCurrency(stats.thisWeek, language)}
                trend={{ value: "+8%", positive: true }}
                color="text-blue-400"
                bgColor="bg-blue-500/10"
                borderColor="border-blue-500/20"
              />
              <StatCard
                icon={<Package className="w-5 h-5" />}
                label={t("ordersCompleted", language)}
                value={stats.ordersCompleted.toString()}
                trend={{ value: `${stats.acceptanceRate}%`, positive: true }}
                color="text-purple-400"
                bgColor="bg-purple-500/10"
                borderColor="border-purple-500/20"
              />
              <StatCard
                icon={<Star className="w-5 h-5" />}
                label={t("rating", language)}
                value={stats.rating.toFixed(1)}
                trend={{ value: "5.0 max", positive: false }}
                color="text-amber-400"
                bgColor="bg-amber-500/10"
                borderColor="border-amber-500/20"
              />
            </div>

            {/* Total Earnings Card */}
            <div className="glass rounded-2xl border border-border/50 p-6 mb-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{t("totalEarnings", language)}</p>
                  <p className="text-3xl font-bold text-foreground">{formatCurrency(stats.totalEarnings, language)}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("allTime", language)}</p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <IndianRupee className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border/50">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.thisMonth, language)}</p>
                  <p className="text-xs text-muted-foreground">{t("thisMonth", language)}</p>
                </div>
                <div className="text-center border-x border-border/50">
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.pendingPayout, language)}</p>
                  <p className="text-xs text-muted-foreground">{t("pendingPayout", language)}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.avgPerOrder, language)}</p>
                  <p className="text-xs text-muted-foreground">{t("avgPerOrder", language)}</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <QuickStat
                icon={<TrendingUp className="w-4 h-4 text-green-400" />}
                label={t("avgPerDay", language)}
                value={formatCurrency(Math.round(stats.avgPerDay), language)}
              />
              <QuickStat
                icon={<TrendingUp className="w-4 h-4 text-blue-400" />}
                label={t("bestDay", language)}
                value={formatDate(stats.bestDay, language)}
              />
              <QuickStat
                icon={<Calendar className="w-4 h-4 text-purple-400" />}
                label={t("lastPayout", language)}
                value={formatDate(stats.lastPayout, language)}
              />
              <QuickStat
                icon={<Clock className="w-4 h-4 text-amber-400" />}
                label={t("payoutSchedule", language)}
                value={t("weeklyPayout", language)}
              />
            </div>

            {/* Time Filter */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {timeFilters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap flex-shrink-0",
                    timeFilter === filter
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border/50"
                  )}
                >
                  {t(filter, language)}
                </button>
              ))}
            </div>

            {/* Earnings History */}
            <div className="glass rounded-2xl border border-border/50 overflow-hidden">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">{t("earningsHistory", language)}</h2>
                <span className="text-sm text-muted-foreground">
                  {filteredHistory.length} {t("daily", language)} entries
                </span>
              </div>
              
              {filteredHistory.length === 0 ? (
                <div className="p-8 text-center">
                  <Wallet className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">{t("noHistory", language)}</h3>
                  <p className="text-muted-foreground">{t("noHistoryDesc", language)}</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {filteredHistory.map((entry) => (
                    <div key={entry.date} className="p-4 flex items-center justify-between hover:bg-primary/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{formatDate(entry.date, language)}</p>
                          <p className="text-sm text-muted-foreground">{entry.orders} {t("orders", language)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{formatCurrency(entry.total, language)}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(entry.amount, language)} + {formatCurrency(entry.tips, language)} {t("tips", language)}</p>
                      </div>
                    </div>
                  ))}
                  <div className="p-4 bg-primary/5 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{t("total", language)} ({filteredHistory.length} {t("daily", language)})</span>
                      <span className="font-bold text-primary">{formatCurrency(totalFiltered, language)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-muted-foreground">{t("avgPerDay", language)}</span>
                      <span className="text-sm font-medium text-foreground">{formatCurrency(Math.round(avgFiltered), language)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payout Info */}
            <div className="glass rounded-2xl border border-border/50 p-4 mt-6">
              <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Wallet className="w-5 h-5" /> Payout Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("pendingPayout", language)}</span>
                  <span className="font-medium text-foreground">{formatCurrency(stats.pendingPayout, language)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("lastPayout", language)}</span>
                  <span className="font-medium text-foreground">{formatDate(stats.lastPayout, language)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("payoutSchedule", language)}</span>
                  <span className="font-medium text-foreground">{t("weeklyPayout", language)}</span>
                </div>
                <Button variant="outline" className="w-full mt-2" size="sm" onClick={() => alert("Instant payout: 2% fee")}>
                  <Zap className="w-4 h-4 mr-2" /> {t("instantPayout", language)}
                </Button>
              </div>
            </div>
          </>
        )}

      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass-strong border-t border-border/50 backdrop-blur-xl">
        <div className="grid grid-cols-5">
          <NavItem href="/driver" icon={<Home className="w-5 h-5" />} label={t("dashboard", language)} active={false} />
          <NavItem href="/driver/routes" icon={<List className="w-5 h-5" />} label={t("routes", language)} active={false} />
          <NavItem href="/driver/orders" icon={<Package className="w-5 h-5" />} label={t("orders", language)} active={false} />
          <NavItem href="/driver/earnings" icon={<IndianRupee className="w-5 h-5" />} label={t("earnings", language)} active={true} />
          <NavItem href="/driver/profile" icon={<User className="w-5 h-5" />} label={t("profile", language)} active={false} />
        </div>
      </nav>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
  color,
  bgColor,
  borderColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: { value: string; positive: boolean };
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <div className={cn("glass rounded-2xl border p-4", borderColor)}>
      <div className="flex items-start justify-between">
        <div>
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", bgColor, color)}>
            {icon}
          </div>
          <p className="text-sm font-medium text-muted-foreground mt-3">{label}</p>
          <p className="text-xl font-bold text-foreground mt-1">{value}</p>
        </div>
        {trend && (
          <div className={cn("flex items-center gap-1 text-sm font-medium", trend.positive ? "text-green-400" : "text-red-400")}>
            {trend.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="glass rounded-2xl border border-border/50 p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-semibold text-foreground">{value}</p>
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