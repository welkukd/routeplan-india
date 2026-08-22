"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DriverState {
  isOnline: boolean;
  currentRouteId: string | null;
  orders: any[];
  language: "en" | "hi";
  setOnline: (v: boolean) => void;
  setRoute: (id: string | null) => void;
  setOrders: (orders: any[]) => void;
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