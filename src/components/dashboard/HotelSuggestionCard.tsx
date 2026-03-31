import { useState } from "react";
import { ExternalLink, MapPin, Sparkles, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ParsedHotel } from "@/lib/parseHotels";
import { useMyTrip } from "@/contexts/MyTripContext";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&h=340&fit=crop&q=80";

interface HotelSuggestionCardProps {
  hotel: ParsedHotel;
  index: number;
}

const HotelSuggestionCard = ({ hotel }: HotelSuggestionCardProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const { addItem, removeItem, isSelected, getItem } = useMyTrip();
  const primaryImage = hotel.photoUrl || FALLBACK_IMAGE;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name + (hotel.location ? " " + hotel.location : ""))}`;
  const selected = isSelected(hotel.name);
  const tripItem = getItem(hotel.name);

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selected && tripItem) {
      removeItem(tripItem.id);
    } else {
      addItem(hotel);
    }
  };

  return (
    <>
      {/* Card */}
      <div className="group relative overflow-hidden rounded-lg border border-border/50 bg-card/30 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_12px_40px_hsl(var(--primary)/0.10)]">
        <div className="relative overflow-hidden">
          <AspectRatio ratio={16 / 9}>
            {!imgLoaded && <Skeleton className="absolute inset-0 rounded-none" />}
            <img
              src={primaryImage}
              alt={hotel.name}
              className={`h-full w-full object-cover transition-all duration-500 ${imgLoaded ? "opacity-100 group-hover:scale-105" : "opacity-0"}`}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
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

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-background border-border/50 max-w-lg p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-0 text-left">
            <DialogTitle className="text-foreground text-xl font-semibold tracking-tight">
              {hotel.name}
            </DialogTitle>
            {hotel.location && (
              <DialogDescription className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <MapPin className="w-3.5 h-3.5" />
                {hotel.location}
              </DialogDescription>
            )}
          </DialogHeader>

          <ScrollArea className="h-[70vh]">
            <div className="space-y-6 px-6 pb-6 pt-4">
              {/* Image */}
              <div className="rounded-lg overflow-hidden">
                <AspectRatio ratio={16 / 9}>
                  <img
                    src={primaryImage}
                    alt={hotel.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                    }}
                  />
                </AspectRatio>
              </div>

              {/* Price */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">
                    Preço estimado
                  </p>
                  <span className="text-3xl font-bold text-primary tracking-tight">
                    {hotel.price}
                  </span>
                </div>
                <Badge className="bg-primary/90 text-primary-foreground border-none text-xs">
                  {hotel.badge}
                </Badge>
              </div>

              <Separator className="bg-border/40" />

              {/* Análise do Voya */}
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-primary uppercase tracking-widest">
                  Análise do Voya
                </h5>
                <div className="text-[15px] text-muted-foreground/90 leading-[1.85] whitespace-pre-line">
                  {hotel.detailsText}
                </div>
              </div>

              {/* Maps button */}
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Abrir no Google Maps
                <ExternalLink className="w-3.5 h-3.5 ml-2" />
              </a>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HotelSuggestionCard;
