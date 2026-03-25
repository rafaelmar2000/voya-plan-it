import { Star, MapPin } from "lucide-react";

interface DashboardHotelCardProps {
  name: string;
  location: string;
  rating: number;
  pricePerNight: string;
  imageUrl: string;
  amenities: string[];
  onSelect?: () => void;
}

const DashboardHotelCard = ({
  name,
  location,
  rating,
  pricePerNight,
  imageUrl,
  amenities,
  onSelect,
}: DashboardHotelCardProps) => {
  return (
    <div className="flex overflow-hidden border border-foreground/10 bg-[hsl(228,14%,8%)] hover:-translate-y-0.5 transition-all duration-300 group">
      {/* Image */}
      <div className="w-36 sm:w-44 shrink-0 overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Info */}
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-semibold text-foreground truncate">{name}</h4>
            <div className="flex items-center gap-1 shrink-0">
              <Star className="w-3.5 h-3.5 text-primary fill-primary" />
              <span className="text-xs font-medium text-primary">{rating}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-muted-foreground mb-2">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="text-xs truncate">{location}</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {amenities.map((a) => (
              <span
                key={a}
                className="text-[10px] text-muted-foreground border border-foreground/10 px-1.5 py-0.5 uppercase tracking-wider"
              >
                {a}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-primary">{pricePerNight}</span>
            <span className="text-[10px] text-muted-foreground">/noite</span>
          </div>
          <button
            onClick={onSelect}
            className="text-xs border border-primary/40 text-primary px-3 py-1.5 hover:bg-primary/10 transition-all duration-200"
          >
            Selecionar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHotelCard;
