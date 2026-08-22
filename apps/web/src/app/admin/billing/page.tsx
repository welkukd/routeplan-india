"use client";

import { useState } from "react";
import * as React from "react";
import {
  CreditCard,
  FileText,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  Edit,
  MoreHorizontal,
  DollarSign,
  Receipt,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  RefreshCw,
  Banknote,
  Coins,
  Smartphone,
  BarChart3,
} from "lucide-react";
import { Button } from "@routeplan/ui";
import { cn, formatCurrency } from "@routeplan/ui";

const mockInvoices = [
  {
    id: "INV-2024-001",
    customer: "Mumbai Dairy Co.",
    customerId: "CUST-001",
    amount: 125000,
    tax: 22500,
    total: 147500,
    status: "paid",
    date: "2024-08-01",
    dueDate: "2024-08-15",
    paidDate: "2024-08-10",
    items: [
      { desc: "Route Optimization - July", qty: 1, rate: 50000 },
      { desc: "Delivery Management", qty: 15, rate: 3000 },
      { desc: "WhatsApp Notifications", qty: 450, rate: 50 },
    ],
  },
  {
    id: "INV-2024-002",
    customer: "Delhi Pharmacy Chain",
    customerId: "CUST-002",
    amount: 280000,
    tax: 50400,
    total: 330400,
    status: "paid",
    date: "2024-08-01",
    dueDate: "2024-08-15",
    paidDate: "2024-08-12",
    items: [
      { desc: "Route Optimization - July", qty: 1, rate: 75000 },
      { desc: "Delivery Management", qty: 8, rate: 5000 },
      { desc: "WhatsApp Notifications", qty: 320, rate: 75 },
      { desc: "Priority Support", qty: 1, rate: 15000 },
    ],
  },
  {
    id: "INV-2024-003",
    customer: "Bangalore Bakery Co.",
    customerId: "CUST-003",
    amount: 95000,
    tax: 17100,
    total: 112100,
    status: "pending",
    date: "2024-08-01",
    dueDate: "2024-08-15",
    items: [
      { desc: "Route Optimization - July", qty: 1, rate: 40000 },
      { desc: "Delivery Management", qty: 12, rate: 2500 },
      { desc: "WhatsApp Notifications", qty: 280, rate: 50 },
    ],
  },
  {
    id: "INV-2024-004",
    customer: "Chennai Kirana Store",
    customerId: "CUST-004",
    amount: 180000,
    tax: 32400,
    total: 212400,
    status: "overdue",
    date: "2024-07-01",
    dueDate: "2024-07-15",
    items: [
      { desc: "Route Optimization - June", qty: 1, rate: 60000 },
      { desc: "Delivery Management", qty: 20, rate: 3000 },
      { desc: "WhatsApp Notifications", qty: 600, rate: 50 },
    ],
  },
  {
    id: "INV-2024-005",
    customer: "Hyderabad Dairy Farms",
    customerId: "CUST-005",
    amount: 75000,
    tax: 13500,
    total: 88500,
    status: "cancelled",
    date: "2024-07-01",
    dueDate: "2024-07-15",
    items: [
      { desc: "Route Optimization - June", qty: 1, rate: 35000 },
      { desc: "Delivery Management", qty: 10, rate: 2500 },
      { desc: "WhatsApp Notifications", qty: 200, rate: 50 },
    ],
  },
  {
    id: "INV-2024-006",
    customer: "Pune Medicine Hub",
    customerId: "CUST-006",
    amount: 150000,
    tax: 27000,
    total: 177000,
    status: "paid",
    date: "2024-08-01",
    dueDate: "2024-08-15",
    paidDate: "2024-08-14",
    items: [
      { desc: "Route Optimization - July", qty: 1, rate: 55000 },
      { desc: "Delivery Management", qty: 6, rate: 5000 },
      { desc: "WhatsApp Notifications", qty: 180, rate: 75 },
    ],
  },
  {
    id: "INV-2024-007",
    customer: "Kolkata Sweets & Bakery",
    customerId: "CUST-007",
    amount: 110000,
    tax: 19800,
    total: 129800,
    status: "pending",
    date: "2024-08-01",
    dueDate: "2024-08-15",
    items: [
      { desc: "Route Optimization - July", qty: 1, rate: 45000 },
      { desc: "Delivery Management", qty: 14, rate: 2500 },
      { desc: "WhatsApp Notifications", qty: 350, rate: 50 },
    ],
  },
  {
    id: "INV-2024-008",
    customer: "Ahmedabad Kirana Wholesale",
    customerId: "CUST-008",
    amount: 320000,
    tax: 57600,
    total: 377600,
    status: "paid",
    date: "2024-08-01",
    dueDate: "2024-08-15",
    paidDate: "2024-08-08",
    items: [
      { desc: "Route Optimization - July", qty: 1, rate: 80000 },
      { desc: "Delivery Management", qty: 25, rate: 4000 },
      { desc: "WhatsApp Notifications", qty: 800, rate: 50 },
      { desc: "API Access", qty: 1, rate: 20000 },
    ],
  },
];

const mockPayments = [
  {
    id: "PAY-2024-001",
    invoiceId: "INV-2024-001",
    customer: "Mumbai Dairy Co.",
    amount: 147500,
    method: "UPI",
    date: "2024-08-10",
    status: "success",
    transactionId: "UPI1234567890",
  },
  {
    id: "PAY-2024-002",
    invoiceId: "INV-2024-002",
    customer: "Delhi Pharmacy Chain",
    amount: 330400,
    method: "Bank Transfer",
    date: "2024-08-12",
    status: "success",
    transactionId: "NEFT9876543210",
  },
  {
    id: "PAY-2024-003",
    invoiceId: "INV-2024-006",
    customer: "Pune Medicine Hub",
    amount: 177000,
    method: "Card",
    date: "2024-08-14",
    status: "success",
    transactionId: "CARD5555666677",
  },
  {
    id: "PAY-2024-004",
    invoiceId: "INV-2024-008",
    customer: "Ahmedabad Kirana Wholesale",
    amount: 377600,
    method: "UPI",
    date: "2024-08-08",
    status: "success",
    transactionId: "UPI1111222233",
  },
  {
    id: "PAY-2024-005",
    invoiceId: "INV-2024-003",
    customer: "Bangalore Bakery Co.",
    amount: 112100,
    method: "UPI",
    date: "2024-08-16",
    status: "pending",
    transactionId: "UPI4444555566",
  },
  {
    id: "PAY-2024-006",
    invoiceId: "INV-2024-004",
    customer: "Chennai Kirana Store",
    amount: 212400,
    method: "Bank Transfer",
    date: "2024-07-20",
    status: "failed",
    transactionId: "NEFT7777888899",
  },
];

const statusOptions = ["All", "Paid", "Pending", "Overdue", "Cancelled"];
const paymentStatusOptions = ["All", "Success", "Pending", "Failed"];
const tabs = ["Invoices", "Payments", "Subscriptions", "Reports"];

const getStatusConfig = (status: string) => {
  const configs = {
    paid: { className: "bg-green-500/10 text-green-400 border-green-500/20", label: "Paid", icon: CheckCircle },
    pending: { className: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "Pending", icon: Clock },
    overdue: { className: "bg-red-500/10 text-red-400 border-red-500/20", label: "Overdue", icon: AlertCircle },
    cancelled: { className: "bg-gray-500/10 text-gray-400 border-gray-500/20", label: "Cancelled", icon: XCircle },
    success: { className: "bg-green-500/10 text-green-400 border-green-500/20", label: "Success", icon: CheckCircle },
    failed: { className: "bg-red-500/10 text-red-400 border-red-500/20", label: "Failed", icon: XCircle },
  };
  return configs[status as keyof typeof configs] || configs.pending;
};

const getMethodIcon = (method: string) => {
  const icons = {
    UPI: Smartphone,
    "Bank Transfer": Banknote,
    Card: CreditCard,
    Cash: Coins,
  };
  return icons[method as keyof typeof icons] || CreditCard;
};

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState("Invoices");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const itemsPerPage = 5;

  const currentStatusOptions = activeTab === "Invoices" ? statusOptions : paymentStatusOptions;

  const filteredInvoices = mockInvoices
    .filter((invoice) => {
      const matchesSearch =
        invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customerId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "All" || invoice.status === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredPayments = mockPayments
    .filter((payment) => {
      const matchesSearch =
        payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.invoiceId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "All" || payment.status === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = activeTab === "Invoices"
    ? Math.ceil(filteredInvoices.length / itemsPerPage)
    : Math.ceil(filteredPayments.length / itemsPerPage);

  const filteredData = activeTab === "Invoices" ? filteredInvoices : filteredPayments;

  const getStatusBadge = (item: typeof mockInvoices[0] | typeof mockPayments[0]) => {
    const config = getStatusConfig(item.status);
    const Icon = config.icon;
    return (
      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", config.className)}>
        <Icon className="w-3 h-3 mr-1.5" />
        {config.label}
      </span>
    );
  };

  const renderInvoiceRows = () => {
    if (paginatedInvoices.length === 0) {
      return (
        <tr>
          <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
            <div className="flex flex-col items-center gap-3">
              <FileText className="w-12 h-12 opacity-30" />
              <p className="text-lg">No invoices found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          </td>
        </tr>
      );
    }

    return paginatedInvoices.map((invoice) => {
      const isExpanded = expandedRow === invoice.id;
      return (
        <React.Fragment key={invoice.id}>
          <tr className={cn("hover:bg-accent/30 transition-colors", isExpanded && "bg-accent/20")}>
            <td className="px-4 py-4">
              <p className="font-medium text-foreground">{invoice.id}</p>
              <p className="text-xs text-muted-foreground">{invoice.customerId}</p>
            </td>
            <td className="px-4 py-4">
              <p className="font-medium text-foreground">{invoice.customer}</p>
            </td>
            <td className="px-4 py-4 text-foreground">{formatCurrency(invoice.amount)}</td>
            <td className="px-4 py-4 text-muted-foreground">{formatCurrency(invoice.tax)}</td>
            <td className="px-4 py-4 font-medium text-foreground">{formatCurrency(invoice.total)}</td>
            <td className="px-4 py-4">{getStatusBadge(invoice)}</td>
            <td className="px-4 py-4 text-sm text-muted-foreground">
              <p>{new Date(invoice.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
              <p>Due: {new Date(invoice.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
            </td>
            <td className="px-4 py-4 text-right">
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label={`View ${invoice.id}`}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label={`Edit ${invoice.id}`}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-green-400" aria-label={`Download ${invoice.id}`}>
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="More actions">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setExpandedRow(isExpanded ? null : invoice.id)}
                  aria-label={isExpanded ? `Collapse ${invoice.id}` : `Expand ${invoice.id}`}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              </div>
            </td>
          </tr>
          {isExpanded && (
            <tr>
              <td colSpan={8} className="px-4 py-0">
                <div className="bg-secondary/50 p-4 border-t border-border/30">
                  <h4 className="font-medium text-foreground mb-4">Invoice Items</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50 text-left text-muted-foreground">
                          <th className="px-3 py-2 font-medium">Description</th>
                          <th className="px-3 py-2 font-medium text-right">Qty</th>
                          <th className="px-3 py-2 font-medium text-right">Rate</th>
                          <th className="px-3 py-2 font-medium text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {invoice.items.map((item, i) => (
                          <tr key={i} className="hover:bg-accent/30">
                            <td className="px-3 py-2 text-foreground">{item.desc}</td>
                            <td className="px-3 py-2 text-right text-muted-foreground">{item.qty}</td>
                            <td className="px-3 py-2 text-right text-muted-foreground">{formatCurrency(item.rate)}</td>
                            <td className="px-3 py-2 text-right font-medium text-foreground">{formatCurrency(item.qty * item.rate)}</td>
                          </tr>
                        ))}
                        <tr className="bg-secondary/50">
                          <td colSpan={3} className="px-3 py-2 text-right font-medium text-foreground">Subtotal</td>
                          <td className="px-3 py-2 text-right font-medium text-foreground">{formatCurrency(invoice.amount)}</td>
                        </tr>
                        <tr className="bg-secondary/50">
                          <td colSpan={3} className="px-3 py-2 text-right font-medium text-foreground">GST (18%)</td>
                          <td className="px-3 py-2 text-right font-medium text-foreground">{formatCurrency(invoice.tax)}</td>
                        </tr>
                        <tr className="bg-primary/10">
                          <td colSpan={3} className="px-3 py-2 text-right font-bold text-foreground">Total</td>
                          <td className="px-3 py-2 text-right font-bold text-foreground">{formatCurrency(invoice.total)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </td>
            </tr>
          )}
        </React.Fragment>
      );
    });
  };

  const renderPaymentRows = () => {
    if (paginatedPayments.length === 0) {
      return (
        <tr>
          <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
            <div className="flex flex-col items-center gap-3">
              <CreditCard className="w-12 h-12 opacity-30" />
              <p className="text-lg">No payments found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          </td>
        </tr>
      );
    }

    return paginatedPayments.map((payment) => (
      <tr key={payment.id} className="hover:bg-accent/30 transition-colors">
        <td className="px-4 py-4">
          <p className="font-medium text-foreground">{payment.id}</p>
          <p className="text-xs text-muted-foreground">{payment.transactionId}</p>
        </td>
        <td className="px-4 py-4 text-sm text-muted-foreground">{payment.invoiceId}</td>
        <td className="px-4 py-4 font-medium text-foreground">{payment.customer}</td>
        <td className="px-4 py-4 font-medium text-foreground">{formatCurrency(payment.amount)}</td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            {(() => {
              const MethodIcon = getMethodIcon(payment.method);
              return <MethodIcon className="w-4 h-4 text-muted-foreground" />;
            })()}
            <span className="text-sm text-foreground">{payment.method}</span>
          </div>
        </td>
        <td className="px-4 py-4">{getStatusBadge(payment)}</td>
        <td className="px-4 py-4 text-sm text-muted-foreground">
          {new Date(payment.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
        </td>
        <td className="px-4 py-4 text-right">
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label={`View ${payment.id}`}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-green-400" aria-label={`Download receipt ${payment.id}`}>
              <Receipt className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="More actions">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </td>
      </tr>
    ));
  };

  // Summary stats
  const paidInvoices = mockInvoices.filter((i) => i.status === "paid");
  const pendingInvoices = mockInvoices.filter((i) => i.status === "pending");
  const overdueInvoices = mockInvoices.filter((i) => i.status === "overdue");
  const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.total, 0);
  const pendingAmount = pendingInvoices.reduce((sum, i) => sum + i.total, 0);
  const overdueAmount = overdueInvoices.reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Billing</h1>
          <p className="text-muted-foreground mt-1">Manage invoices, payments, and subscriptions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button variant="default" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="glass p-6 rounded-xl border border-border/50">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="font-display text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-green-400 mt-1">Collected from paid invoices</p>
        </div>
        <div className="glass p-6 rounded-xl border border-border/50">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="font-display text-2xl font-bold text-amber-400">{formatCurrency(pendingAmount)}</p>
          <p className="text-xs text-muted-foreground mt-1">{pendingInvoices.length} invoices awaiting payment</p>
        </div>
        <div className="glass p-6 rounded-xl border border-border/50">
          <p className="text-sm text-muted-foreground">Overdue</p>
          <p className="font-display text-2xl font-bold text-red-400">{formatCurrency(overdueAmount)}</p>
          <p className="text-xs text-muted-foreground mt-1">{overdueInvoices.length} invoices past due date</p>
        </div>
        <div className="glass p-6 rounded-xl border border-border/50">
          <p className="text-sm text-muted-foreground">This Month</p>
          <p className="font-display text-2xl font-bold text-foreground">
            {formatCurrency(mockPayments.filter((p) => p.date.startsWith("2024-08") && p.status === "success").reduce((sum, p) => sum + p.amount, 0))}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Successful payments in August</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass rounded-xl border border-border/50 overflow-hidden">
        <div className="border-b border-border/50">
          <nav className="flex gap-1 px-2 py-1" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => { setActiveTab(tab); setCurrentPage(1); setStatusFilter("All"); }}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  activeTab === tab
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={activeTab === "Invoices" ? "Search invoices..." : "Search payments..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 bg-background border border-border/50 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[150px]"
            >
              {currentStatusOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/50">
                  {activeTab === "Invoices" ? (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider" scope="col">Invoice</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider" scope="col">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider" scope="col">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider" scope="col">Tax</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider" scope="col">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider" scope="col">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider" scope="col">Date / Due</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider" scope="col">Actions</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider" scope="col">Payment ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider" scope="col">Invoice</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider" scope="col">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider" scope="col">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider" scope="col">Method</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider" scope="col">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider" scope="col">Date</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider" scope="col">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {activeTab === "Invoices" ? renderInvoiceRows() : renderPaymentRows()}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} results
              </p>
              <div className="flex items-center gap-1">
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
                  let pageNum: number;
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
      </div>
    </div>
  );
}