import { useState } from "react";
import { ExternalLink, MapPin, Sparkles, Wifi, Shield, Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ParsedHotel } from "@/lib/parseHotels";

function getHotelImage(hotelName: string): string {
  const query = encodeURIComponent(hotelName + " hotel");
  return `https://source.unsplash.com/600x340/?${query}`;
}

const FALLBACK_IMAGES = [
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const primaryImage = getHotelImage(hotel.name);
  const fallback = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name + (hotel.location ? ' ' + hotel.location : ''))}`;

  const handleOpenMaps = () => {
    window.open(mapsUrl, "_blank");
  };

  return (
    <>
      <div className="group relative overflow-hidden rounded-lg border border-border/50 bg-card/30 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_12px_40px_hsl(var(--primary)/0.10)]">
        {/* Image */}
        <div className="relative overflow-hidden">
          <AspectRatio ratio={16 / 9}>
            <img
              src={primaryImage}
              alt={hotel.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallback;
              }}
            />
          </AspectRatio>
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
          <div className="absolute top-3 left-3">
            <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm border-none text-[10px] uppercase tracking-wider font-medium px-2.5 py-1">
              <Sparkles className="w-3 h-3 mr-1" />
              {hotel.badge}
            </Badge>
          </div>
          <div className="absolute bottom-3 right-3 bg-background/60 backdrop-blur-md border border-border/30 rounded-md px-3 py-1.5">
            <span className="text-sm font-bold text-primary">{hotel.price}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2.5">
          <div>
            <h4 className="font-semibold text-foreground text-sm leading-tight">{hotel.name}</h4>
            {hotel.location && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <MapPin className="w-3 h-3 shrink-0" />
                {hotel.location}
              </p>
            )}
          </div>

          {hotel.description && (
            <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
              {hotel.description}
            </p>
          )}

          {hotel.highlights.length > 0 && (
            <ul className="space-y-1">
              {hotel.highlights.slice(0, 3).map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
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
              className="flex-1 text-xs h-8 border-border/50 hover:border-primary/50 hover:bg-primary/5"
              onClick={() => setDetailsOpen(true)}
            >
              Ver Detalhes
            </Button>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center text-xs h-8 px-3 rounded-md text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 mr-1" />
              Maps
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-background border-border/50 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg">{hotel.name}</DialogTitle>
            {hotel.location && (
              <DialogDescription className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                {hotel.location}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4">
            {/* Image */}
            <div className="rounded-md overflow-hidden">
              <AspectRatio ratio={16 / 9}>
                <img
                  src={primaryImage}
                  alt={hotel.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = fallback;
                  }}
                />
              </AspectRatio>
            </div>

            {/* Price + Badge */}
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-primary">{hotel.price}</span>
              <Badge className="bg-primary/90 text-primary-foreground border-none text-xs">
                {hotel.badge}
              </Badge>
            </div>

            {/* Description */}
            {hotel.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{hotel.description}</p>
            )}

            {/* Info icons row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-1.5 rounded-md border border-border/40 bg-muted/20 p-3">
                <Wifi className="w-5 h-5 text-primary" />
                <span className="text-[10px] text-muted-foreground text-center">Wi-Fi de Alta Velocidade</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 rounded-md border border-border/40 bg-muted/20 p-3">
                <Camera className="w-5 h-5 text-primary" />
                <span className="text-[10px] text-muted-foreground text-center">Workspace p/ Fotógrafos</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 rounded-md border border-border/40 bg-muted/20 p-3">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-[10px] text-muted-foreground text-center">Cofre p/ Equipamentos</span>
              </div>
            </div>

            {/* All highlights */}
            {hotel.highlights.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-foreground">Destaques</h5>
                <ul className="space-y-1.5">
                  {hotel.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-2 h-1 w-1 rounded-full bg-primary shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Maps button */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Abrir no Google Maps
              <ExternalLink className="w-3.5 h-3.5 ml-2" />
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HotelSuggestionCard;
