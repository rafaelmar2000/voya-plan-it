import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import type { ParsedHotel } from "@/lib/parseHotels";

export interface TripItem {
  id: string;
  item: ParsedHotel;
  selectedClass?: string;
  priceNumeric: number;
}

interface MyTripContextValue {
  items: TripItem[];
  addItem: (item: ParsedHotel, selectedClass?: string) => void;
  removeItem: (id: string) => void;
  isSelected: (name: string) => boolean;
  getItem: (name: string) => TripItem | undefined;
  totalBudget: number;
  clearTrip: () => void;
  setOnItemAdded: (cb: ((item: TripItem) => void) | null) => void;
  loadTripForRoteiro: (roteiroId: string | null) => void;
  saveTripForRoteiro: (roteiroId: string | null) => void;
}

const MyTripContext = createContext<MyTripContextValue | null>(null);

function storageKey(roteiroId: string | null) {
  return roteiroId ? `voya_trip_${roteiroId}` : "voya_trip_new";
}

function loadFromStorage(roteiroId: string | null): TripItem[] {
  try {
    const raw = localStorage.getItem(storageKey(roteiroId));
    if (!raw) return [];
    return JSON.parse(raw) as TripItem[];
  } catch {
    return [];
  }
}

function saveToStorage(roteiroId: string | null, items: TripItem[]) {
  try {
    localStorage.setItem(storageKey(roteiroId), JSON.stringify(items));
  } catch {}
}

function removeFromStorage(roteiroId: string | null) {
  try {
    localStorage.removeItem(storageKey(roteiroId));
  } catch {}
}

function extractNumericPrice(price: string): number {
  const s = price.trim().replace(/\s*\/noite/gi, "").replace(/\s*\/night/gi, "").replace(/\u2013/g, "-").replace(/\u2014/g, "-");

  const tierMatch = s.match(/^(\${2,4})$/);
  if (tierMatch) {
    const len = tierMatch[1].length;
    return (len === 2 ? 50 : len === 3 ? 100 : 200) * 5.7;
  }

  const plusMatch = s.match(/\+\s*(?:US\$|USD|\$)\s*([\d.,]+)/i);
  if (plusMatch) {
    const val = parseFloat(plusMatch[1].replace(/\./g, "").replace(",", "."));
    return isNaN(val) ? 0 : (val * 1.2) * 5.7;
  }

  const rangeMatch = s.match(/(?:US\$|USD|\$)\s*([\d.,]+)\s*-\s*([\d.,]+)/i);
  if (rangeMatch) {
    const lo = parseFloat(rangeMatch[1].replace(/\./g, "").replace(",", "."));
    const hi = parseFloat(rangeMatch[2].replace(/\./g, "").replace(",", "."));
    if (!isNaN(lo) && !isNaN(hi)) {
      const avg = (lo + hi) / 2;
      return /R\$/i.test(s) ? avg : avg * 5.7;
    }
  }

  const usdMatch = s.match(/(?:US\$|USD)\s*([\d.,]+)/i);
  if (usdMatch) {
    const val = parseFloat(usdMatch[1].replace(/\./g, "").replace(",", "."));
    return isNaN(val) ? 0 : val * 5.7;
  }

  const brlMatch = s.match(/R\$\s*([\d.,]+)/i);
  if (brlMatch) {
    const val = parseFloat(brlMatch[1].replace(/\./g, "").replace(",", "."));
    return isNaN(val) ? 0 : val;
  }

  return 0;
}

export function MyTripProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<TripItem[]>([]);
  const currentRoteiroId = useRef<string | null>(null);
  const onItemAddedRef = useRef<((item: TripItem) => void) | null>(null);

  const setOnItemAdded = useCallback((cb: ((item: TripItem) => void) | null) => {
    onItemAddedRef.current = cb;
  }, []);

  const loadTripForRoteiro = useCallback((roteiroId: string | null) => {
    currentRoteiroId.current = roteiroId;
    setItems(loadFromStorage(roteiroId));
  }, []);

  const saveTripForRoteiro = useCallback((roteiroId: string | null) => {
    if (!roteiroId) return;
    const newItems = loadFromStorage(null);
    if (newItems.length > 0) {
      saveToStorage(roteiroId, newItems);
      removeFromStorage(null);
    }
    currentRoteiroId.current = roteiroId;
  }, []);

  useEffect(() => {
    saveToStorage(currentRoteiroId.current, items);
  }, [items]);

  const addItem = useCallback((item: ParsedHotel, selectedClass?: string) => {
    const id = `${item.name}-${item.kind}-${selectedClass || ""}`;
    const newItem: TripItem = { id, item, selectedClass, priceNumeric: extractNumericPrice(item.price) };
    setItems((prev) => {
      if (prev.some((i) => i.id === id)) return prev;
      return [...prev, newItem];
    });
    setTimeout(() => onItemAddedRef.current?.(newItem), 100);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const isSelected = useCallback(
    (name: string) => items.some((i) => i.item.name === name),
    [items]
  );

  const getItem = useCallback(
    (name: string) => items.find((i) => i.item.name === name),
    [items]
  );

  const totalBudget = items.reduce((sum, i) => sum + i.priceNumeric, 0);

  const clearTrip = useCallback(() => {
    removeFromStorage(currentRoteiroId.current);
    setItems([]);
  }, []);

  return (
    <MyTripContext.Provider value={{
      items, addItem, removeItem, isSelected, getItem,
      totalBudget, clearTrip, setOnItemAdded,
      loadTripForRoteiro, saveTripForRoteiro
    }}>
      {children}
    </MyTripContext.Provider>
  );
}

export function useMyTrip() {
  const ctx = useContext(MyTripContext);
  if (!ctx) throw new Error("useMyTrip must be used within MyTripProvider");
  return ctx;
}
