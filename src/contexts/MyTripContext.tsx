import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
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
}

const MyTripContext = createContext<MyTripContextValue | null>(null);

function extractNumericPrice(price: string): number {
  const cleaned = price.replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function MyTripProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<TripItem[]>([]);
  const onItemAddedRef = useRef<((item: TripItem) => void) | null>(null);

  const setOnItemAdded = useCallback((cb: ((item: TripItem) => void) | null) => {
    onItemAddedRef.current = cb;
  }, []);

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
  const clearTrip = useCallback(() => setItems([]), []);

  return (
    <MyTripContext.Provider value={{ items, addItem, removeItem, isSelected, getItem, totalBudget, clearTrip, setOnItemAdded }}>
      {children}
    </MyTripContext.Provider>
  );
}

export function useMyTrip() {
  const ctx = useContext(MyTripContext);
  if (!ctx) throw new Error("useMyTrip must be used within MyTripProvider");
  return ctx;
}
