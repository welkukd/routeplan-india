"use client";

import { ArrowRight, Truck, Smartphone, Zap, Shield, Globe, CheckCircle, ArrowUpRight, QrCode, ChevronRight, MessageSquare } from "lucide-react";

const features = [
  {
    icon: Smartphone,
    title: "WhatsApp-First",
    desc: "Customers order, drivers receive, owners track — all on WhatsApp. No app download needed.",
  },
  {
    icon: Truck,
    title: "Smart Routing",
    desc: "VRP solver built for Indian roads — narrow lanes, traffic patterns, time windows, multi-stop optimization.",
  },
  {
    icon: Zap,
    title: "Instant Dispatch",
    desc: "Auto-assign orders to nearest driver. Real-time GPS tracking. Live ETA updates via WhatsApp.",
  },
  {
    icon: Shield,
    title: "GST-Ready Billing",
    desc: "Auto-generate GST-compliant invoices. Razorpay UPI/card subscriptions. HSN codes for logistics.",
  },
  {
    icon: Globe,
    title: "Hindi + English",
    desc: "Full bilingual support. Devanagari rendering. Voice notes for low-literacy users.",
  },
  {
    icon: CheckCircle,
    title: "Free Tier Forever",
    desc: "Built on Vercel, Supabase, Gupshup, Razorpay free tiers. Zero monthly cost until you scale.",
  },
];

const stats = [
  { value: "₹0", label: "Monthly Cost" },
  { value: "15min", label: "Setup Time" },
  { value: "99.9%", label: "Uptime (Vercel)" },
  { value: "500MB", label: "DB Free Tier" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-amber-500/5 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
                  <Truck className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-background" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">RoutePlan India</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <a href="https://wa.me/91XXXXXXXXXX" target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">
                <Smartphone className="w-4 h-4" />
                Start on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-8 border-amber-500/20">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-amber-300">Phase 1 Live — WhatsApp Routing for Indian SMBs</span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
              <span className="text-foreground">Circuit for</span>
              <br />
              <span className="text-gradient-gold">Indian SMBs</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              WhatsApp-first routing & dispatch SaaS for dairy, pharmacy, bakery & kirana.
              Built for India. Free tier only. Live in 15 minutes.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <a
                href="https://wa.me/91XXXXXXXXXX?text=Hi%20RoutePlan%2C%20I%20want%20to%20automate%20my%20delivery%20routing%20via%20WhatsApp."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary px-8 py-3 text-base gap-3 group"
              >
                <Smartphone className="w-5 h-5" />
                Start on WhatsApp
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </a>
              <a href="#demo" className="btn-outline px-8 py-3 text-base">
                Watch 2-min Demo
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <span>Vercel + Supabase + Gupshup</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <span>GST Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <span>DPDP Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <span>Mumbai Data Region</span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="glass p-6 text-center border-amber-500/10 hover:border-amber-500/30 transition-colors">
                <div className="font-display text-3xl sm:text-4xl font-bold text-amber-400 mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <ArrowUpRight className="w-6 h-6 text-muted-foreground/50" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-28 lg:py-32 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Built for <span className="text-gradient-gold">How India Works</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Every feature designed around WhatsApp, cash flow, and Indian ground reality.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="glass p-6 hover:border-amber-500/30 transition-all duration-300 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-28 lg:py-32 bg-background/50 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-0" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Live in <span className="text-gradient-gold">3 Steps</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              No technical setup. No developer needed. Just WhatsApp.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Scan & Connect",
                desc: "Scan QR code or click WhatsApp link. Verify your business in 2 minutes. We auto-create your organization.",
                icon: Smartphone,
              },
              {
                step: "02",
                title: "Add Stops & Drivers",
                desc: "Drop pins on map or paste addresses. Add driver WhatsApp numbers. Set time windows per customer.",
                icon: Truck,
              },
              {
                step: "03",
                title: "Auto-Dispatch Daily",
                desc: "Every morning, optimized routes sent to drivers on WhatsApp. Track live. Collect proof of delivery. Auto-invoice.",
                icon: Zap,
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="glass p-6 h-full border-amber-500/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center text-primary-foreground font-bold text-lg">
                      {item.step}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-amber-400" />
                    </div>
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
                {i < 2 && (
                  <div className="absolute top-14 right-0 w-full md:w-1/2 h-px bg-gradient-to-r from-amber-500/30 to-transparent hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp Onboarding Flow */}
      <section id="onboarding" className="py-20 sm:py-28 lg:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-0" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Get Started in <span className="text-gradient-gold">2 Minutes</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Scan the QR code or click the button to start onboarding via WhatsApp. No app download required.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
            {/* QR Code Side */}
            <div className="glass-strong p-8 md:p-12 rounded-2xl text-center border-amber-500/20">
              <div className="mb-6">
                <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">Scan to Start</h3>
                <p className="text-muted-foreground mb-6">Open WhatsApp and scan this QR code to begin setup</p>
              </div>
              <div className="glass p-6 rounded-xl border-amber-500/10 mb-6">
                <div className="aspect-square w-64 mx-auto mb-4 rounded-lg bg-secondary flex items-center justify-center relative">
                  <div className="text-center">
                    <QrCode className="w-24 h-24 text-amber-400 mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">QR Code Placeholder</p>
                    <p className="text-xs text-muted-foreground mt-1">wa.me/91XXXXXXXXXX</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href="https://wa.me/91XXXXXXXXXX?text=Hi%20RoutePlan%2C%20I%20want%20to%20automate%20my%20delivery%20routing%20via%20WhatsApp."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary px-8 py-3 text-base gap-3 group"
                  >
                    <Smartphone className="w-5 h-5" />
                    Open in WhatsApp
                    <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </a>
                  <button
                    className="btn-outline px-8 py-3 text-base gap-2"
                    aria-label="Copy WhatsApp link"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Copy Link
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                By continuing, you agree to our <a href="#" className="underline hover:text-amber-400">Terms of Service</a> and <a href="#" className="underline hover:text-amber-400">Privacy Policy</a>
              </p>
            </div>

            {/* Steps Side */}
            <div className="space-y-6">
              <div className="glass p-6 border-amber-500/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center text-primary-foreground font-bold text-lg">
                    01
                  </div>
                  <h3 className="font-display text-xl font-bold">Connect Your Business</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Scan the QR code or click "Open in WhatsApp". You'll land in a chat with RoutePlan. 
                  Reply with your business name and type (Dairy, Pharmacy, Bakery, Kirana, or Other).
                </p>
              </div>

              <div className="glass p-6 border-amber-500/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center text-primary-foreground font-bold text-lg">
                    02
                  </div>
                  <h3 className="font-display text-xl font-bold">Add Stops & Drivers</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Send locations via WhatsApp (tap 📎 {'>'} Location) or type addresses. Add driver names, 
                  phone numbers, and vehicle types. Set delivery time windows per customer.
                </p>
              </div>

              <div className="glass p-6 border-amber-500/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center text-primary-foreground font-bold text-lg">
                    03
                  </div>
                  <h3 className="font-display text-xl font-bold">Auto-Dispatch Daily</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Every morning at 6 AM, optimized routes are sent to drivers on WhatsApp. 
                  Track live GPS, collect proof of delivery, and auto-generate GST invoices.
                </p>
              </div>

              <div className="glass p-6 bg-amber-500/5 border-amber-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h3 className="font-display text-lg font-bold text-amber-300">Free Forever Tier</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-400" /> 1,000 WhatsApp conversations/month</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-400" /> 5 drivers included</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-400" /> Route optimization engine</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-400" /> GST-compliant invoices</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-amber-400" /> Hindi + English support</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Segments */}
      <section className="py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Designed for <span className="text-gradient-gold">Your Business</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Whether you deliver 20 milk cans or 200 medicine orders — same WhatsApp flow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🥛", name: "Dairy", desc: "Morning routes, cold chain, recurring subscriptions" },
              { icon: "💊", name: "Pharmacy", desc: "Time-critical, prescription verification, compliance" },
              { icon: "🍞", name: "Bakery", desc: "Freshness windows, multi-location, waste tracking" },
              { icon: "🏪", name: "Kirana", desc: "High frequency, small tickets, credit management" },
            ].map((segment, i) => (
              <div key={i} className="glass p-6 text-center hover:border-amber-500/30 transition-colors">
                <div className="text-5xl mb-4">{segment.icon}</div>
                <h3 className="font-display text-xl font-bold mb-2">{segment.name}</h3>
                <p className="text-sm text-muted-foreground">{segment.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-28 lg:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              <span className="text-gradient-gold">₹0</span> to Start. Pay When You Grow.
            </h2>
            <p className="text-lg text-muted-foreground">
              Free tier covers 1000 WhatsApp conversations/month. Upgrade only when you exceed.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="glass p-6 border-amber-500/10">
              <h3 className="font-display text-xl font-bold mb-2">Starter</h3>
              <div className="text-4xl font-bold text-amber-400 mb-2">₹0<span className="text-sm font-normal text-muted-foreground">/month</span></div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle className="w-4 h-4 text-amber-400" /> Up to 1000 WhatsApp convos</li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle className="w-4 h-4 text-amber-400" /> 5 drivers included</li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle className="w-4 h-4 text-amber-400" /> Route optimization</li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle className="w-4 h-4 text-amber-400" /> GST invoices</li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle className="w-4 h-4 text-amber-400" /> WhatsApp support</li>
              </ul>
              <a href="https://wa.me/91XXXXXXXXXX" target="_blank" rel="noopener noreferrer" className="btn-outline w-full">
                Start Free
              </a>
            </div>

            <div className="glass-strong p-6 border-amber-500/30 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                Most Popular
              </div>
              <h3 className="font-display text-xl font-bold mb-2">Growth</h3>
              <div className="text-4xl font-bold text-amber-400 mb-2">₹2,999<span className="text-sm font-normal text-muted-foreground">/month</span></div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle className="w-4 h-4 text-amber-400" /> Up to 10,000 WhatsApp convos</li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle className="w-4 h-4 text-amber-400" /> 25 drivers included</li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle className="w-4 h-4 text-amber-400" /> Priority routing</li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle className="w-4 h-4 text-amber-400" /> API access</li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle className="w-4 h-4 text-amber-400" /> Email + WhatsApp support</li>
              </ul>
              <a href="https://wa.me/91XXXXXXXXXX" target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
                Upgrade to Growth
              </a>
            </div>

            <div className="glass p-6 border-amber-500/10">
              <h3 className="font-display text-xl font-bold mb-2">Enterprise</h3>
              <div className="text-4xl font-bold text-amber-400 mb-2">Custom</div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle className="w-4 h-4 text-amber-400" /> Unlimited conversations</li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle className="w-4 h-4 text-amber-400" /> Unlimited drivers</li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle className="w-4 h-4 text-amber-400" /> Custom integrations</li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle className="w-4 h-4 text-amber-400" /> Dedicated support</li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle className="w-4 h-4 text-amber-400" /> SLA guarantee</li>
              </ul>
              <a href="https://wa.me/91XXXXXXXXXX" target="_blank" rel="noopener noreferrer" className="btn-outline w-full">
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="demo" className="py-20 sm:py-28 lg:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-background" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="glass-strong p-8 sm:p-12 lg:p-16 rounded-2xl text-center border-amber-500/20 max-w-3xl mx-auto">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Ready to Automate Your Routes?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join 50+ Indian SMBs saving 15+ hours/week on routing. Start on WhatsApp in 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://wa.me/91XXXXXXXXXX?text=Hi%20RoutePlan%2C%20I%20want%20to%20automate%20my%20delivery%20routing%20via%20WhatsApp."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary px-8 py-3 text-base gap-3"
              >
                <Smartphone className="w-5 h-5" />
                Start Free on WhatsApp
                <ArrowRight className="w-5 h-5" />
              </a>
              <a href="#features" className="btn-outline px-8 py-3 text-base">
                See All Features
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
                  <Truck className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-display text-xl font-bold text-foreground">RoutePlan India</span>
              </div>
              <p className="text-muted-foreground max-w-sm">
                Circuit for Indian SMBs. WhatsApp-first routing & dispatch. Built on free tiers. Made in India 🇮🇳
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 RoutePlan India. Free tier forever. GSTIN: 27AAAAA0000A1Z5
            </p>
            <div className="flex items-center gap-6">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Globe className="w-5 h-5" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Truck className="w-5 h-5" />
              </a>
              <a href="https://wa.me/91XXXXXXXXXX" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Smartphone className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}