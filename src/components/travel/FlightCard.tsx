import { Plane, Clock, ArrowRight } from "lucide-react";

interface FlightCardProps {
  airline: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: string;
  stops: string;
  logoUrl?: string;
  selected?: boolean;
  onSelect?: () => void;
}

const FlightCard = ({
  airline,
  departure,
  arrival,
  departureTime,
  arrivalTime,
  duration,
  price,
  stops,
  logoUrl,
  selected,
  onSelect,
}: FlightCardProps) => {
  const isDirect = stops === "Direto";

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-lg p-5 transition-all duration-300 border ${
        selected
          ? "border-primary bg-surface-hover shadow-[0_0_20px_hsl(var(--gold)/0.1)]"
          : "border-border bg-card hover:border-primary/50 hover:bg-surface-hover hover:shadow-[0_0_24px_hsl(36_90%_55%/_0.12)]"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        {logoUrl ? (
          <img src={logoUrl} alt={airline} className="h-6 object-contain" />
        ) : (
          <span className="text-sm font-medium text-foreground">{airline}</span>
        )}
        <span
          className={`text-xs px-2 py-1 rounded-sm border ${
            isDirect
              ? "bg-emerald-950 text-emerald-400 border-emerald-800"
              : "bg-amber-950 text-amber-400 border-amber-800"
          }`}
        >
          {stops}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="text-center">
          <p className="text-xl font-display font-semibold text-foreground">{departureTime}</p>
          <p className="text-xs text-muted-foreground mt-1">{departure}</p>
        </div>

        <div className="flex-1 flex items-center gap-2">
          <div className="h-px flex-1 border-t border-dashed border-border/60" />
          <Plane className="w-4 h-4 text-primary shrink-0" />
          <div className="h-px flex-1 border-t border-dashed border-border/60" />
        </div>

        <div className="text-center">
          <p className="text-xl font-display font-semibold text-foreground">{arrivalTime}</p>
          <p className="text-xs text-muted-foreground mt-1">{arrival}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs">{duration}</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">a partir de</span>
          <p className="text-lg font-display font-bold text-primary">{price}</p>
        </div>
      </div>
    </button>
  );
};

export default FlightCard;
