import { ExternalLink, MapPin, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import type { ParsedHotel } from "@/lib/parseHotels";

const UNSPLASH_PHOTOS = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=340&fit=crop&q=80",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=340&fit=crop&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&h=340&fit=crop&q=80",
  "https://images.unsplash.com/photo-1455587734955-081b22074882?w=600&h=340&fit=crop&q=80",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&h=340&fit=crop&q=80",
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&h=340&fit=crop&q=80",
];

interface HotelSuggestionCardProps {
  hotel: ParsedHotel;
  index: number;
}

const HotelSuggestionCard = ({ hotel, index }: HotelSuggestionCardProps) => {
  const imageUrl = UNSPLASH_PHOTOS[index % UNSPLASH_PHOTOS.length];
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(hotel.name)}`;

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border/60 bg-card/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_8px_32px_hsl(var(--primary)/0.12)]">
      {/* Image */}
      <div className="relative overflow-hidden">
        <AspectRatio ratio={16 / 9}>
          <img
            src={imageUrl}
            alt={hotel.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </AspectRatio>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

        {/* Badge */}
        <div className="absolute top-3 left-3">
          <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm border-none text-[10px] uppercase tracking-wider font-medium px-2.5 py-1">
            <Sparkles className="w-3 h-3 mr-1" />
            {hotel.badge}
          </Badge>
        </div>

        {/* Price floating */}
        <div className="absolute bottom-3 right-3 bg-background/70 backdrop-blur-md border border-border/40 rounded-md px-3 py-1.5">
          <span className="text-sm font-bold text-primary">{hotel.price}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h4 className="font-semibold text-foreground text-sm leading-tight truncate">
          {hotel.name}
        </h4>

        {/* Highlights */}
        {hotel.highlights.length > 0 && (
          <ul className="space-y-1.5">
            {hotel.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-1 h-1 w-1 rounded-full bg-primary shrink-0" />
                <span className="line-clamp-1">{h}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs h-8 border-border/60 hover:border-primary/50 hover:bg-primary/5"
          >
            Ver Detalhes
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs h-8 text-muted-foreground hover:text-primary"
            asChild
          >
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              Maps
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HotelSuggestionCard;
