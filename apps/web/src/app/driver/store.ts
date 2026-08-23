"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  latitude: number;
  longitude: number;
  delivery_window_start: string | null;
  delivery_window_end: string | null;
  status: string;
  sequence: number;
  items: unknown[];
  total_amount: number;
}

interface DriverState {
  isOnline: boolean;
  currentRouteId: string | null;
  orders: Order[];
  language: "en" | "hi";
  setOnline: (v: boolean) => void;
  setRoute: (id: string | null) => void;
  setOrders: (orders: Order[]) => void;
  setLanguage: (lang: "en" | "hi") => void;
}

export const useDriverStore = create<DriverState>()(
  persist(
    (set) => ({
      isOnline: false,
      currentRouteId: null,
      orders: [],
      language: "en",
      setOnline: (v) => set({ isOnline: v }),
      setRoute: (id) => set({ currentRouteId: id }),
      setOrders: (orders) => set({ orders }),
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: "driver-pwa-storage",
    }
  )
);