"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "e-stock-sidebar-collapsed";

type SidebarLayoutContextValue = {
  collapsed: boolean;
  /** Après lecture du localStorage côté client */
  hydrated: boolean;
  setCollapsed: (value: boolean) => void;
  toggleCollapsed: () => void;
};

const SidebarLayoutContext = createContext<SidebarLayoutContextValue | null>(null);

export function useSidebarLayout(): SidebarLayoutContextValue {
  const ctx = useContext(SidebarLayoutContext);
  if (!ctx) {
    throw new Error("useSidebarLayout must be used within SidebarLayoutProvider");
  }
  return ctx;
}

export function SidebarLayoutProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setCollapsedState(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ collapsed, hydrated, setCollapsed, toggleCollapsed }),
    [collapsed, hydrated, setCollapsed, toggleCollapsed]
  );

  return <SidebarLayoutContext.Provider value={value}>{children}</SidebarLayoutContext.Provider>;
}
