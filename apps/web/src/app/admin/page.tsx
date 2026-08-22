import {
  Users,
  MapPin,
  Truck,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  MoreHorizontal,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Activity,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { Button, cn } from "@routeplan/ui";
import {
  getDashboardMetrics,
  getRecentActivity,
  getRouteStatusDistribution,
  formatCurrency,
  formatNumber,
  formatRelativeTime,
} from "@/lib/admin-dashboard";

export const dynamic = "force-dynamic";

const statCards = [
  {
    name: "Total Customers",
    icon: Users,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    href: "/admin/customers",
  },
  {
    name: "Active Drivers",
    icon: Truck,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    href: "/admin/drivers",
  },
  {
    name: "Today's Routes",
    icon: MapPin,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    href: "/admin/routes",
  },
  {
    name: "Pending Orders",
    icon: AlertCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    href: "/admin/orders",
  },
  {
    name: "Monthly Revenue",
    icon: CreditCard,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    href: "/admin/billing",
  },
  {
    name: "WhatsApp Conversations",
    icon: MessageCircle,
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
    href: "/admin/whatsapp",
  },
];

const quickActions = [
  {
    name: "Add Customer",
    description: "Onboard new customer",
    icon: Users,
    href: "/admin/customers/new",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    name: "Create Route",
    description: "Plan new delivery route",
    icon: MapPin,
    href: "/admin/routes/new",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
  },
  {
    name: "Assign Driver",
    description: "Assign driver to route",
    icon: Truck,
    href: "/admin/drivers/assign",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  {
    name: "Generate Invoice",
    description: "Create GST invoice",
    icon: CreditCard,
    href: "/admin/billing/invoices/new",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  {
    name: "View Analytics",
    description: "Detailed reports",
    icon: Activity,
    href: "/admin/analytics",
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
  },
  {
    name: "Export Data",
    description: "Download reports",
    icon: Download,
    href: "/admin/export",
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
  },
];

async function DashboardStats() {
  const metrics = await getDashboardMetrics();
  const recentActivity = await getRecentActivity(10);
  const routeStatuses = await getRouteStatusDistribution();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your delivery operations and key metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="w-4 h-4" />
            Last 30 days
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button variant="default" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {statCards.map((stat, index) => {
          let value = "0";
          let change = "+12%";
          let changeType: "increase" | "decrease" = "increase";

          switch (index) {
            case 0:
              value = formatNumber(metrics.totalCustomers);
              change = "+12%";
              changeType = "increase";
              break;
            case 1:
              value = formatNumber(metrics.activeDrivers);
              change = "+5%";
              changeType = "increase";
              break;
            case 2:
              value = formatNumber(metrics.todaysRoutes);
              change = "-2%";
              changeType = "decrease";
              break;
            case 3:
              value = formatNumber(metrics.pendingOrders);
              change = "+8%";
              changeType = "increase";
              break;
            case 4:
              value = formatCurrency(metrics.monthlyRevenue);
              change = "+18%";
              changeType = "increase";
              break;
            case 5:
              value = formatNumber(metrics.whatsappConversations);
              change = "+3%";
              changeType = "increase";
              break;
          }

          const StatIcon = stat.icon;

          return (
            <Link
              key={stat.name}
              href={stat.href}
              className="glass p-6 hover:border-amber-500/30 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                  <p className="font-display text-3xl font-bold text-foreground mt-1">{value}</p>
                </div>
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bgColor)}>
                  <StatIcon className={cn("w-6 h-6", stat.color)} aria-hidden="true" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span
                  className={cn(
                    "text-sm font-medium flex items-center gap-1",
                    changeType === "increase" ? "text-green-400" : "text-red-400"
                  )}
                >
                  {changeType === "increase" ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {change}
                </span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 glass p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-bold text-foreground">Recent Activity</h2>
            <Button variant="ghost" size="sm" className="gap-1">
              <MoreHorizontal className="w-4 h-4" />
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              recentActivity.map((activity) => {
                let icon = Activity;
                let color = "text-gray-400";
                let bgColor = "bg-gray-500/10";

                switch (activity.type) {
                  case "order":
                    icon = AlertCircle;
                    color = "text-blue-400";
                    bgColor = "bg-blue-500/10";
                    break;
                  case "route":
                    icon = MapPin;
                    color = "text-green-400";
                    bgColor = "bg-green-500/10";
                    break;
                  case "customer":
                    icon = Users;
                    color = "text-purple-400";
                    bgColor = "bg-purple-500/10";
                    break;
                }

                const ActivityIcon = icon;

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", bgColor)}>
                      <ActivityIcon className={cn("w-5 h-5", color)} aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{activity.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">{activity.description}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(activity.time)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Route Status & Quick Actions */}
        <div className="space-y-6">
          {/* Route Status */}
          <div className="glass p-6">
            <h2 className="font-display text-xl font-bold text-foreground mb-6">Route Status</h2>
            <div className="space-y-4">
              {routeStatuses.map((status) => (
                <div key={status.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-3 h-3 rounded-full", status.color)} />
                    <span className="text-sm font-medium text-foreground">{status.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 bg-secondary rounded-full flex-1 max-w-32 overflow-hidden"
                      role="progressbar"
                      aria-valuenow={status.value}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", status.color)}
                        style={{ width: `${status.value}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-foreground w-10 text-right">{status.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass p-6">
            <h2 className="font-display text-xl font-bold text-foreground mb-6">Quick Actions</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => {
                const ActionIcon = action.icon;
                return (
                  <Link
                    key={action.name}
                    href={action.href}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg border border-border/50 hover:border-amber-500/30 hover:bg-accent/50 transition-all duration-200 group",
                      action.bgColor
                    )}
                  >
                    <ActionIcon className={cn("w-5 h-5 flex-shrink-0", action.color)} aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{action.name}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="glass p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold text-foreground">Delivery Performance</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Week</Button>
            <Button variant="outline" size="sm">Month</Button>
            <Button variant="outline" size="sm">Quarter</Button>
          </div>
        </div>
        <div className="h-64 bg-secondary/50 rounded-xl flex items-center justify-center border border-border/30">
          <div className="text-center text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Chart placeholder</p>
            <p className="text-sm mt-1">Integrate with Recharts or Chart.js</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  return <DashboardStats />;
}