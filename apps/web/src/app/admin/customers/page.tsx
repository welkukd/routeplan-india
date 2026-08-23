"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Truck,
  CreditCard,
  Activity,
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  Eye,
  X,
} from "lucide-react";
import { Button } from "@routeplan/ui";
import { cn, formatCurrency } from "@routeplan/ui";

const mockCustomers = [
  {
    id: "CUST-001",
    name: "Mumbai Dairy Co.",
    type: "Dairy",
    contact: "Rajesh Patel",
    phone: "+91 98765 43210",
    email: "rajesh@mumbaidairy.in",
    address: "Andheri East, Mumbai, Maharashtra 400069",
    stops: 15,
    monthlyOrders: 450,
    revenue: 125000,
    status: "active",
    lastOrder: "2024-08-20",
    gstin: "27AAACM1234A1Z5",
  },
  {
    id: "CUST-002",
    name: "Delhi Pharmacy Chain",
    type: "Pharmacy",
    contact: "Dr. Priya Sharma",
    phone: "+91 98123 45678",
    email: "priya@delhipharma.in",
    address: "Connaught Place, New Delhi 110001",
    stops: 8,
    monthlyOrders: 320,
    revenue: 280000,
    status: "active",
    lastOrder: "2024-08-21",
    gstin: "07AAACD5678B2Z6",
  },
  {
    id: "CUST-003",
    name: "Bangalore Bakery Co.",
    type: "Bakery",
    contact: "Suresh Kumar",
    phone: "+91 99887 76655",
    email: "suresh@blrbakery.in",
    address: "Koramangala, Bangalore, Karnataka 560034",
    stops: 12,
    monthlyOrders: 280,
    revenue: 95000,
    status: "active",
    lastOrder: "2024-08-19",
    gstin: "29AAACB9012C3Z7",
  },
  {
    id: "CUST-004",
    name: "Chennai Kirana Store",
    type: "Kirana",
    contact: "Lakshmi Devi",
    phone: "+91 98765 11223",
    email: "lakshmi@chennaikirana.in",
    address: "T. Nagar, Chennai, Tamil Nadu 600017",
    stops: 20,
    monthlyOrders: 600,
    revenue: 180000,
    status: "active",
    lastOrder: "2024-08-21",
    gstin: "33AAACK3456D4Z8",
  },
  {
    id: "CUST-005",
    name: "Hyderabad Dairy Farms",
    type: "Dairy",
    contact: "Mohammed Ali",
    phone: "+91 91234 56789",
    email: "ali@hydairy.in",
    address: "Banjara Hills, Hyderabad, Telangana 500034",
    stops: 10,
    monthlyOrders: 200,
    revenue: 75000,
    status: "inactive",
    lastOrder: "2024-07-15",
    gstin: "36AAACH7890E5Z9",
  },
  {
    id: "CUST-006",
    name: "Pune Medicine Hub",
    type: "Pharmacy",
    contact: "Anita Deshpande",
    phone: "+91 90123 45678",
    email: "anita@punemeds.in",
    address: "FC Road, Pune, Maharashtra 411005",
    stops: 6,
    monthlyOrders: 180,
    revenue: 150000,
    status: "active",
    lastOrder: "2024-08-20",
    gstin: "27AAACM5555F6Z0",
  },
  {
    id: "CUST-007",
    name: "Kolkata Sweets & Bakery",
    type: "Bakery",
    contact: "Subrata Banerjee",
    phone: "+91 98301 23456",
    email: "subrata@kolkatasweets.in",
    address: "Park Street, Kolkata, West Bengal 700016",
    stops: 14,
    monthlyOrders: 350,
    revenue: 110000,
    status: "active",
    lastOrder: "2024-08-18",
    gstin: "19AAACK7777G7Z1",
  },
  {
    id: "CUST-008",
    name: "Ahmedabad Kirana Wholesale",
    type: "Kirana",
    contact: "Harsh Patel",
    phone: "+91 97234 56789",
    email: "harsh@amdavadkirana.in",
    address: "Maninagar, Ahmedabad, Gujarat 380008",
    stops: 25,
    monthlyOrders: 800,
    revenue: 320000,
    status: "active",
    lastOrder: "2024-08-21",
    gstin: "24AAACA9999H8Z2",
  },
];

const customerTypes = ["All", "Dairy", "Pharmacy", "Bakery", "Kirana"];
const statusOptions = ["All", "Active", "Inactive"];

function SortIcon({ sortKey, sortConfig }: { sortKey: string; sortConfig: { key: string; direction: "asc" | "desc" } | null }) {
  if (sortConfig?.key !== sortKey) return <span className="w-4 h-4 opacity-30" />;
  return sortConfig.direction === "asc" ? (
    <ChevronLeft className="w-4 h-4" />
  ) : (
    <ChevronRight className="w-4 h-4" />
  );
}

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const itemsPerPage = 5;

  const filteredCustomers = useMemo(() => {
    return mockCustomers
      .filter((customer) => {
        const matchesSearch =
          customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.phone.includes(searchQuery) ||
          customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.id.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType = typeFilter === "All" || customer.type === typeFilter;
        const matchesStatus = statusFilter === "All" || customer.status === statusFilter.toLowerCase();

        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => {
        if (!sortConfig) return 0;
        const aVal = a[sortConfig.key as keyof typeof a];
        const bVal = b[sortConfig.key as keyof typeof b];
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
  }, [searchQuery, typeFilter, statusFilter, sortConfig]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev?.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      active: { className: "bg-green-500/10 text-green-400 border-green-500/20", label: "Active" },
      inactive: { className: "bg-red-500/10 text-red-400 border-red-500/20", label: "Inactive" },
    };
    const config = configs[status as keyof typeof configs] || configs.active;
    return (
      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", config.className)}>
        <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", status === "active" ? "bg-green-400" : "bg-red-400")} />
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      Dairy: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      Pharmacy: "bg-green-500/10 text-green-400 border-green-500/20",
      Bakery: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      Kirana: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };
    return (
      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", colors[type as keyof typeof colors] || colors.Dairy)}>
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage customer accounts, orders, and delivery preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="default" size="sm" className="gap-2" onClick={() => {}}>
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass p-4 sm:p-6 rounded-xl">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
              aria-label="Search customers"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input py-2 px-3 min-w-[150px]"
              aria-label="Filter by type"
            >
              {customerTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input py-2 px-3 min-w-[150px]"
              aria-label="Filter by status"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" role="grid">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/50">
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("name")}
                  scope="col"
                >
                  <div className="flex items-center gap-2">
                    Customer
                    <SortIcon sortKey="name" sortConfig={sortConfig} />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("type")}
                  scope="col"
                >
                  <div className="flex items-center gap-2">
                    Type
                    <SortIcon sortKey="type" sortConfig={sortConfig} />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("monthlyOrders")}
                  scope="col"
                >
                  <div className="flex items-center gap-2">
                    Monthly Orders
                    <SortIcon sortKey="monthlyOrders" sortConfig={sortConfig} />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("revenue")}
                  scope="col"
                >
                  <div className="flex items-center gap-2">
                    Revenue
                    <SortIcon sortKey="revenue" sortConfig={sortConfig} />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider" scope="col">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider" scope="col">
                  Last Order
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider" scope="col">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <Search className="w-12 h-12 opacity-30" />
                      <p className="text-lg">No customers found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-foreground">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.id}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {customer.address.split(",")[0]}, {customer.address.split(",")[1]?.trim()}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getTypeBadge(customer.type)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{customer.monthlyOrders}</span>
                        <span className="text-xs text-muted-foreground">({customer.stops} stops)</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{formatCurrency(customer.revenue)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">{getStatusBadge(customer.status)}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {new Date(customer.lastOrder).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label={`View ${customer.name}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label={`Edit ${customer.name}`}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-400" aria-label={`Delete ${customer.name}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="More actions">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} customers
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    aria-label={`Page ${pageNum}`}
                    aria-current={currentPage === pageNum ? "page" : undefined}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="glass p-4 rounded-xl">
          <p className="text-sm text-muted-foreground">Total Customers</p>
          <p className="font-display text-2xl font-bold text-foreground">{mockCustomers.length}</p>
        </div>
        <div className="glass p-4 rounded-xl">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="font-display text-2xl font-bold text-green-400">
            {mockCustomers.filter((c) => c.status === "active").length}
          </p>
        </div>
        <div className="glass p-4 rounded-xl">
          <p className="text-sm text-muted-foreground">Total Monthly Orders</p>
          <p className="font-display text-2xl font-bold text-foreground">
            {mockCustomers.reduce((sum, c) => sum + c.monthlyOrders, 0).toLocaleString()}
          </p>
        </div>
        <div className="glass p-4 rounded-xl">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="font-display text-2xl font-bold text-foreground">
            {formatCurrency(mockCustomers.reduce((sum, c) => sum + c.revenue, 0))}
          </p>
        </div>
      </div>
    </div>
  );
}