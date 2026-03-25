import { Plane, Clock } from "lucide-react";

interface DashboardFlightCardProps {
  airline: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: string;
  stops: string;
  onSelect?: () => void;
}

const DashboardFlightCard = ({
  airline,
  departure,
  arrival,
  departureTime,
  arrivalTime,
  duration,
  price,
  stops,
  onSelect,
}: DashboardFlightCardProps) => {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left border border-foreground/10 bg-[hsl(228,14%,8%)] p-4 hover:-translate-y-0.5 transition-all duration-300 group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Plane className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{airline}</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-foreground/10 px-2 py-0.5">
          {stops}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="text-center">
          <p className="text-lg font-bold text-foreground leading-none">{departureTime}</p>
          <p className="text-[10px] text-muted-foreground mt-1 tracking-wider">{departure}</p>
        </div>

        <div className="flex-1 flex items-center gap-2">
          <div className="h-px flex-1 bg-foreground/10" />
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span className="text-[10px]">{duration}</span>
          </div>
          <div className="h-px flex-1 bg-foreground/10" />
        </div>

        <div className="text-center">
          <p className="text-lg font-bold text-foreground leading-none">{arrivalTime}</p>
          <p className="text-[10px] text-muted-foreground mt-1 tracking-wider">{arrival}</p>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <p className="text-base font-bold text-primary">{price}</p>
      </div>
    </button>
  );
};

export default DashboardFlightCard;
