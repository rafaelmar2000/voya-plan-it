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
  selected,
  onSelect,
}: FlightCardProps) => {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-lg p-5 transition-all duration-300 border ${
        selected
          ? "border-primary bg-surface-hover shadow-[0_0_20px_hsl(var(--gold)/0.1)]"
          : "border-border bg-card hover:border-primary/40 hover:bg-surface-hover"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-foreground">{airline}</span>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-sm">
          {stops}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="text-center">
          <p className="text-xl font-display font-semibold text-foreground">{departureTime}</p>
          <p className="text-xs text-muted-foreground mt-1">{departure}</p>
        </div>

        <div className="flex-1 flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <Plane className="w-4 h-4 text-primary shrink-0" />
          <div className="h-px flex-1 bg-border" />
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
        <p className="text-lg font-display font-bold text-primary">{price}</p>
      </div>
    </button>
  );
};

export default FlightCard;
