"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MapPin,
  BarChart3,
  CreditCard,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Truck,
  Bell,
  LogOut,
  User,
  Moon,
  Sun,
} from "lucide-react";
import { cn, Button } from "@routeplan/ui";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Routes", href: "/admin/routes", icon: MapPin },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Billing", href: "/admin/billing", icon: CreditCard },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

const userNavItems = [
  { name: "Profile", href: "/admin/profile", icon: User },
  { name: "Notifications", href: "/admin/notifications", icon: Bell },
  { name: "Logout", href: "/auth/logout", icon: LogOut },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) return savedTheme === "dark";
    }
    return true;
  });
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth < 1024) {
      queueMicrotask(() => setSidebarOpen(false));
    }
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static z-50 flex h-full flex-col glass-strong border-r border-border/30 transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-20" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label="Main navigation"
      >
        {/* Logo & Toggle */}
        <div className={cn("flex h-16 items-center justify-between px-4 border-b border-border/30", sidebarCollapsed && "justify-center")}>
          <Link href="/admin" className="flex items-center gap-3" aria-label="RoutePlan Admin">
            <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 text-primary-foreground" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-display text-xl font-bold text-foreground">RoutePlan</span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Admin navigation">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  sidebarCollapsed && "justify-center px-2"
                )}
                aria-current={isActive ? "page" : undefined}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar collapse toggle & User section */}
        <div className="border-t border-border/30 p-3">
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">Admin User</p>
                  <p className="text-xs text-muted-foreground truncate">admin@routeplan.in</p>
                </div>
              </div>
              <div className="mt-2 space-y-1">
                {userNavItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="mx-auto"
              onClick={() => setSidebarCollapsed(false)}
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          )}

          {!sidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute -right-3 top-1/2 -translate-y-1/2 lg:static lg:ml-auto lg:mt-0 lg:translate-y-0"
              onClick={() => setSidebarCollapsed(true)}
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 glass border-b border-border/30 lg:ml-0">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* Breadcrumb / Page Title */}
              <div className="hidden sm:block">
                <h1 className="font-display text-xl font-bold text-foreground">
                  {getPageTitle(pathname)}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDarkMode(!darkMode)}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                className="relative"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>

              {/* User Menu Trigger */}
              <div className="relative ml-2">
                <Button variant="ghost" className="flex items-center gap-2 pr-3 pl-2" aria-label="User menu">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="hidden md:block text-sm font-medium text-foreground">Admin</span>
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </Button>
                {/* Dropdown would go here - using simple links for now */}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="mx-auto max-w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    "/admin": "Dashboard",
    "/admin/customers": "Customers",
    "/admin/routes": "Routes",
    "/admin/analytics": "Analytics",
    "/admin/billing": "Billing",
    "/admin/settings": "Settings",
    "/admin/profile": "Profile",
    "/admin/notifications": "Notifications",
  };

  // Check for exact matches first
  if (titles[pathname]) return titles[pathname];

  // Check for nested routes
  for (const [path, title] of Object.entries(titles)) {
    if (pathname.startsWith(path + "/")) return title;
  }

  return "Dashboard";
}