import { Briefcase, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useMyTrip } from "@/contexts/MyTripContext";
import { Badge } from "@/components/ui/badge";

const BudgetSummary = () => {
  const { items, totalBudget, removeItem } = useMyTrip();
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  const formatted = totalBudget.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="border-b border-border bg-card/40 backdrop-blur-sm">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full px-6 py-2.5 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-foreground">Meu Roteiro</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {items.length}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-primary font-mono">{formatted}</span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-3 space-y-1.5 animate-fade-in">
          {items.map((ti) => (
            <div
              key={ti.id}
              className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-muted/20"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-muted-foreground capitalize text-[10px] uppercase tracking-wider">
                  {ti.item.kind === "flight" ? "Voo" : ti.item.kind === "hotel" ? "Hotel" : "Item"}
                </span>
                <span className="text-foreground truncate">{ti.item.name}</span>
                {ti.selectedClass && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 border-border/30">
                    {ti.selectedClass}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-primary font-mono font-medium">{ti.item.price}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(ti.id);
                  }}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BudgetSummary;
