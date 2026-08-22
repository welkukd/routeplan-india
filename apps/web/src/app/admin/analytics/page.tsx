"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  MapPin,
  Truck,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Download,
  Filter,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Target,
  DollarSign,
  MapPin as MapPinIcon,
  Truck as TruckIcon,
  Users as UsersIcon,
  Package,
} from "lucide-react";
import { Button } from "@routeplan/ui";
import { cn, formatCurrency } from "@routeplan/ui";

const kpiData = [
  {
    name: "Total Revenue",
    value: "₹12.4L",
    change: "+18.7%",
    changeType: "increase",
    icon: DollarSign,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    description: "vs last month",
  },
  {
    name: "Orders Delivered",
    value: "2,847",
    change: "+12.3%",
    changeType: "increase",
    icon: CheckCircle,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    description: "vs last month",
  },
  {
    name: "On-Time Rate",
    value: "94.2%",
    change: "-0.8%",
    changeType: "decrease",
    icon: Target,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    description: "vs last month",
  },
  {
    name: "Active Drivers",
    value: "156",
    change: "+3.2%",
    changeType: "increase",
    icon: TruckIcon,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    description: "vs last month",
  },
  {
    name: "Avg. Route Efficiency",
    value: "87.5%",
    change: "+2.1%",
    changeType: "increase",
    icon: Activity,
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
    description: "vs last month",
  },
  {
    name: "Customer Satisfaction",
    value: "4.6/5.0",
    change: "+0.1",
    changeType: "increase",
    icon: UsersIcon,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    description: "vs last month",
  },
];

const chartData = {
  revenue: [
    { month: "Jan", revenue: 8.2, orders: 1200 },
    { month: "Feb", revenue: 7.8, orders: 1150 },
    { month: "Mar", revenue: 9.1, orders: 1350 },
    { month: "Apr", revenue: 10.5, orders: 1500 },
    { month: "May", revenue: 11.2, orders: 1650 },
    { month: "Jun", revenue: 11.8, orders: 1720 },
    { month: "Jul", revenue: 12.1, orders: 1800 },
    { month: "Aug", revenue: 12.4, orders: 1850 },
  ],
  ordersByType: [
    { type: "Dairy", orders: 850, revenue: 4.2 },
    { type: "Pharmacy", orders: 720, revenue: 3.8 },
    { type: "Bakery", orders: 580, revenue: 2.5 },
    { type: "Kirana", orders: 697, revenue: 1.9 },
  ],
  driverPerformance: [
    { name: "Rajesh K.", deliveries: 145, onTime: 96, rating: 4.8 },
    { name: "Amit S.", deliveries: 132, onTime: 94, rating: 4.7 },
    { name: "Suresh R.", deliveries: 128, onTime: 97, rating: 4.9 },
    { name: "Lakshmi N.", deliveries: 115, onTime: 93, rating: 4.6 },
    { name: "Mohammed A.", deliveries: 98, onTime: 89, rating: 4.3 },
    { name: "Anita D.", deliveries: 87, onTime: 95, rating: 4.7 },
    { name: "Subrata B.", deliveries: 82, onTime: 91, rating: 4.5 },
    { name: "Harsh P.", deliveries: 156, onTime: 94, rating: 4.8 },
  ],
  routeEfficiency: [
    { route: "RT-001", planned: 45.2, actual: 43.8, efficiency: 97 },
    { route: "RT-002", planned: 32.5, actual: 34.1, efficiency: 95 },
    { route: "RT-003", planned: 28.8, actual: 27.9, efficiency: 97 },
    { route: "RT-004", planned: 52.1, actual: 55.2, efficiency: 94 },
    { route: "RT-005", planned: 38.5, actual: 41.2, efficiency: 93 },
    { route: "RT-006", planned: 22.3, actual: 21.8, efficiency: 98 },
    { route: "RT-007", planned: 35.7, actual: 37.1, efficiency: 96 },
    { route: "RT-008", planned: 68.4, actual: 71.2, efficiency: 96 },
  ],
};

const timeRanges = ["7 Days", "30 Days", "90 Days", "1 Year"];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30 Days");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Track performance metrics and operational insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <div className="flex items-center gap-1 border border-border/50 rounded-lg p-1 bg-secondary/50">
            {timeRanges.map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "ghost"}
                size="sm"
                className="px-3 py-1.5"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiData.map((kpi) => (
          <div
            key={kpi.name}
            className="glass p-6 hover:border-amber-500/30 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{kpi.name}</p>
                <p className="font-display text-3xl font-bold text-foreground mt-1">{kpi.value}</p>
              </div>
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", kpi.bgColor)}>
                <kpi.icon className={cn("w-6 h-6", kpi.color)} aria-hidden="true" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span
                className={cn(
                  "text-sm font-medium flex items-center gap-1",
                  kpi.changeType === "increase" ? "text-green-400" : "text-red-400"
                )}
              >
                {kpi.changeType === "increase" ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {kpi.change}
              </span>
              <span className="text-xs text-muted-foreground">{kpi.description}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue & Orders Trend */}
        <div className="glass p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-bold text-foreground">Revenue & Orders Trend</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-green-400" />
                Revenue (₹L)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-400" />
                Orders
              </span>
            </div>
          </div>
          <div className="h-80 bg-secondary/50 rounded-xl flex items-center justify-center border border-border/30 relative overflow-hidden">
            {/* Simple SVG Chart */}
            <svg viewBox="0 0 800 300" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              <g stroke="#374151" strokeWidth="0.5" strokeDasharray="4,4">
                {[20, 40, 60, 80].map((y) => (
                  <line key={y} x1="60" y1={y} x2="740" y2={y} />
                ))}
                {[140, 220, 300, 380, 460, 540, 620, 700].map((x) => (
                  <line key={x} x1={x} y1="20" x2={x} y2="280" />
                ))}
              </g>
              {/* Revenue Area */}
              <path
                d="M60,240 L140,220 L220,195 L300,160 L380,145 L460,135 L540,130 L620,125 L700,122 L700,280 L60,280 Z"
                fill="url(#revenueGradient)"
              />
              {/* Revenue Line */}
              <path
                d="M60,240 L140,220 L220,195 L300,160 L380,145 L460,135 L540,130 L620,125 L700,122"
                stroke="#22c55e"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Orders Area */}
              <path
                d="M60,270 L140,255 L220,230 L300,205 L380,185 L460,170 L540,160 L620,155 L700,152 L700,280 L60,280 Z"
                fill="url(#ordersGradient)"
              />
              {/* Orders Line */}
              <path
                d="M60,270 L140,255 L220,230 L300,205 L380,185 L460,170 L540,160 L620,155 L700,152"
                stroke="#3b82f6"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Data points */}
              <g>
                {chartData.revenue.map((d, i) => {
                  const x = 60 + i * 80;
                  const revenueY = 280 - (d.revenue / 12.4) * 160;
                  const ordersY = 280 - (d.orders / 1850) * 160;
                  return (
                    <g key={d.month}>
                      <circle cx={x} cy={revenueY} r="4" fill="#22c55e" stroke="#08090a" strokeWidth="2" />
                      <circle cx={x} cy={ordersY} r="4" fill="#3b82f6" stroke="#08090a" strokeWidth="2" />
                      <text x={x} y="295" textAnchor="middle" fontSize="11" fill="#71717a">{d.month}</text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        </div>

        {/* Orders by Type */}
        <div className="glass p-6">
          <h2 className="font-display text-xl font-bold text-foreground mb-6">Orders by Business Type</h2>
          <div className="space-y-4">
            {chartData.ordersByType.map((item, i) => {
              const percentage = (item.orders / chartData.ordersByType.reduce((sum, d) => sum + d.orders, 0)) * 100;
              const colors = [
                "bg-blue-500",
                "bg-green-500",
                "bg-amber-500",
                "bg-purple-500",
              ];
              return (
                <div key={item.type} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded", colors[i])} />
                      <span className="font-medium text-foreground">{item.type}</span>
                    </div>
                    <span className="text-muted-foreground">{item.orders} orders ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", colors[i])}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">₹{item.revenue}L revenue</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Driver Performance */}
        <div className="glass p-6">
          <h2 className="font-display text-xl font-bold text-foreground mb-6">Top Driver Performance</h2>
          <div className="space-y-3">
            {chartData.driverPerformance.map((driver, i) => (
              <div
                key={driver.name}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{driver.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {driver.deliveries} deliveries
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {driver.onTime}% on-time
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {driver.rating}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-400">₹{Math.round(driver.deliveries * 85).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">est. earnings</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Route Efficiency */}
        <div className="glass p-6">
          <h2 className="font-display text-xl font-bold text-foreground mb-6">Route Efficiency</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Route</th>
                  <th className="px-3 py-2 font-medium">Planned (km)</th>
                  <th className="px-3 py-2 font-medium">Actual (km)</th>
                  <th className="px-3 py-2 font-medium">Efficiency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {chartData.routeEfficiency.map((route) => (
                  <tr key={route.route} className="hover:bg-accent/30">
                    <td className="px-3 py-2 font-medium text-foreground">{route.route}</td>
                    <td className="px-3 py-2 text-muted-foreground">{route.planned}</td>
                    <td className="px-3 py-2 text-foreground">{route.actual}</td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          route.efficiency >= 96
                            ? "bg-green-500/10 text-green-400"
                            : route.efficiency >= 94
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-red-500/10 text-red-400"
                        )}
                      >
                        {route.efficiency}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Growth */}
        <div className="glass p-6 lg:col-span-2">
          <h2 className="font-display text-xl font-bold text-foreground mb-6">Customer Growth & Retention</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="glass p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">New Customers</p>
                  <p className="font-display text-2xl font-bold text-foreground">23</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">This Month</span>
                  <span className="font-medium text-foreground">23</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Month</span>
                  <span className="font-medium text-foreground">18</span>
                </div>
                <div className="flex justify-between text-green-400">
                  <span>Growth</span>
                  <span className="font-medium">+27.8%</span>
                </div>
              </div>
            </div>
            <div className="glass p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Retention Rate</p>
                  <p className="font-display text-2xl font-bold text-foreground">91.5%</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Customers</span>
                  <span className="font-medium text-foreground">1,142</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Churned</span>
                  <span className="font-medium text-red-400">105</span>
                </div>
                <div className="flex justify-between text-green-400">
                  <span>Net Growth</span>
                  <span className="font-medium">+12</span>
                </div>
              </div>
            </div>
            <div className="glass p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Revenue/Customer</p>
                  <p className="font-display text-2xl font-bold text-foreground">₹10,850</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Top 10%</span>
                  <span className="font-medium text-foreground">₹45,200</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Median</span>
                  <span className="font-medium text-foreground">₹8,500</span>
                </div>
                <div className="flex justify-between text-green-400">
                  <span>vs Last Month</span>
                  <span className="font-medium">+8.2%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Metrics */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass p-6">
          <h2 className="font-display text-xl font-bold text-foreground mb-6">Delivery Time Distribution</h2>
          <div className="space-y-3">
            {[
              { label: "0-30 min", value: 35, color: "bg-green-500" },
              { label: "30-60 min", value: 42, color: "bg-blue-500" },
              { label: "60-90 min", value: 18, color: "bg-amber-500" },
              { label: "90+ min", value: 5, color: "bg-red-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-24">{item.label}</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-500", item.color)} style={{ width: `${item.value}%` }} />
                </div>
                <span className="text-sm font-medium text-foreground w-10 text-right">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-6">
          <h2 className="font-display text-xl font-bold text-foreground mb-6">Peak Hours Analysis</h2>
          <div className="space-y-3">
            {[
              { hour: "05:00-07:00", orders: 420, label: "Morning Rush" },
              { hour: "07:00-09:00", orders: 680, label: "Peak Morning" },
              { hour: "09:00-12:00", orders: 540, label: "Late Morning" },
              { hour: "12:00-16:00", orders: 320, label: "Afternoon" },
              { hour: "16:00-19:00", orders: 480, label: "Evening Rush" },
              { hour: "19:00-22:00", orders: 280, label: "Night" },
            ].map((item) => (
              <div key={item.hour} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-28">{item.hour}</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600" style={{ width: `${(item.orders / 680) * 100}%` }} />
                </div>
                <span className="text-sm font-medium text-foreground w-16 text-right">{item.orders}</span>
                <span className="text-xs text-muted-foreground w-24">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-6">
          <h2 className="font-display text-xl font-bold text-foreground mb-6">Geographic Coverage</h2>
          <div className="space-y-3">
            {[
              { city: "Mumbai", routes: 28, customers: 340, revenue: "₹4.2L" },
              { city: "Delhi", routes: 22, customers: 280, revenue: "₹3.8L" },
              { city: "Bangalore", routes: 18, customers: 210, revenue: "₹2.5L" },
              { city: "Chennai", routes: 15, customers: 180, revenue: "₹1.9L" },
              { city: "Hyderabad", routes: 12, customers: 140, revenue: "₹1.5L" },
              { city: "Pune", routes: 10, customers: 120, revenue: "₹1.2L" },
            ].map((item) => (
              <div key={item.city} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <MapPinIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.city}</p>
                    <p className="text-xs text-muted-foreground">{item.routes} routes • {item.customers} customers</p>
                  </div>
                </div>
                <span className="font-medium text-foreground">{item.revenue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}