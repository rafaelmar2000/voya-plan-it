import { Star, MapPin, DollarSign } from "lucide-react";

interface RestaurantCardProps {
  name: string;
  cuisine: string;
  location: string;
  rating: number;
  priceLevel: number; // 1-4
  imageUrl: string;
  selected?: boolean;
  onSelect?: () => void;
}

const RestaurantCard = ({
  name,
  cuisine,
  location,
  rating,
  priceLevel,
  imageUrl,
  selected,
  onSelect,
}: RestaurantCardProps) => {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-lg overflow-hidden transition-all duration-300 border ${
        selected
          ? "border-primary shadow-[0_0_20px_hsl(var(--gold)/0.1)]"
          : "border-border hover:border-primary/40"
      }`}
    >
      <div className="h-32 overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>
      <div className="p-4 bg-card">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-display font-semibold text-foreground text-sm leading-tight">{name}</h3>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <Star className="w-3.5 h-3.5 text-primary fill-primary" />
            <span className="text-sm font-medium text-primary">{rating}</span>
          </div>
        </div>

        <p className="text-xs text-primary/80 font-medium mb-2">{cuisine}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="text-xs">{location}</span>
          </div>
          <div className="flex">
            {Array.from({ length: 4 }).map((_, i) => (
              <DollarSign
                key={i}
                className={`w-3 h-3 ${i < priceLevel ? "text-primary" : "text-muted"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </button>
  );
};

export default RestaurantCard;
