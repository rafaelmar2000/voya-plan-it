import { Star, MapPin, Wifi, Car } from "lucide-react";

interface HotelCardProps {
  name: string;
  location: string;
  rating: number;
  pricePerNight: string;
  imageUrl: string;
  amenities: string[];
  selected?: boolean;
  onSelect?: () => void;
}

const HotelCard = ({
  name,
  location,
  rating,
  pricePerNight,
  imageUrl,
  amenities,
  selected,
  onSelect,
}: HotelCardProps) => {
  const amenityIcons: Record<string, React.ReactNode> = {
    wifi: <Wifi className="w-3.5 h-3.5" />,
    parking: <Car className="w-3.5 h-3.5" />,
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-lg overflow-hidden transition-all duration-300 border ${
        selected
          ? "border-primary shadow-[0_0_20px_hsl(var(--gold)/0.1)]"
          : "border-border hover:border-primary/40"
      }`}
    >
      <div className="h-40 overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>
      <div className="p-4 bg-card">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-display font-semibold text-foreground text-base leading-tight">{name}</h3>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <Star className="w-3.5 h-3.5 text-primary fill-primary" />
            <span className="text-sm font-medium text-primary">{rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground mb-3">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="text-xs">{location}</span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          {amenities.map((amenity) => (
            <span
              key={amenity}
              className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-sm capitalize"
            >
              {amenity}
            </span>
          ))}
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-lg font-display font-bold text-primary">{pricePerNight}</span>
          <span className="text-xs text-muted-foreground">/noite</span>
        </div>
      </div>
    </button>
  );
};

export default HotelCard;
