import { useState } from "react";
import { ExternalLink, MapPin, Sparkles, Wifi, Shield, Camera, Clock, SunMedium, Images } from "lucide-react";
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
  const { extendedDetails } = hotel;
  const logisticsTitle = hotel.kind === "flight"
    ? "Logística do Voo"
    : hotel.kind === "attraction"
      ? "Planejamento da Visita"
      : "Logística Fotográfica";
  const photographyTitle = hotel.kind === "flight"
    ? "Observações Operacionais"
    : hotel.kind === "attraction"
      ? "Dicas de Fotografia"
      : "Dicas de Fotografia";

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
        <DialogContent className="bg-background border-border/50 max-w-lg max-h-[85vh] overflow-y-auto p-0">
          <DialogHeader>
            <div className="px-6 pt-6 pb-2">
              <DialogTitle className="text-foreground text-lg">{hotel.name}</DialogTitle>
              {hotel.location && (
                <DialogDescription className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  {hotel.location}
                </DialogDescription>
              )}
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[85vh] overflow-y-auto">
            <div className="space-y-5 px-6 pb-6">
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

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Resumo de Custos</p>
                  <span className="text-2xl font-bold text-primary">{hotel.price}</span>
                </div>
                <Badge className="bg-primary/90 text-primary-foreground border-none text-xs">
                  {hotel.badge}
                </Badge>
              </div>

              <Separator className="bg-border/40" />

              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-foreground tracking-wide uppercase">Destaques</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-md border border-border/40 bg-muted/20 p-3 space-y-1.5">
                    <Wifi className="w-5 h-5 text-primary" />
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Velocidade de Internet</p>
                    <p className="text-sm text-foreground leading-snug">{extendedDetails.internetSpeed || "Não informado pelo Voya"}</p>
                  </div>
                  <div className="rounded-md border border-border/40 bg-muted/20 p-3 space-y-1.5">
                    <Shield className="w-5 h-5 text-primary" />
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Segurança de Equipamento</p>
                    <p className="text-sm text-foreground leading-snug">{extendedDetails.equipmentSecurity || "Não informado pelo Voya"}</p>
                  </div>
                  <div className="rounded-md border border-border/40 bg-muted/20 p-3 space-y-1.5">
                    <MapPin className="w-5 h-5 text-primary" />
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Localização</p>
                    <p className="text-sm text-foreground leading-snug">{hotel.location || "Consultar localização"}</p>
                  </div>
                </div>
              </div>

              {extendedDetails.workspacePhotos && (
                <>
                  <Separator className="bg-border/40" />
                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold text-foreground tracking-wide uppercase flex items-center gap-2">
                      <Images className="w-4 h-4 text-primary" />
                      Workspace
                    </h5>
                    <p className="text-sm text-muted-foreground/80 leading-relaxed">{extendedDetails.workspacePhotos}</p>
                  </div>
                </>
              )}

              {extendedDetails.photographyTips.length > 0 && (
                <>
                  <Separator className="bg-border/40" />
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-foreground tracking-wide uppercase flex items-center gap-2">
                      <Camera className="w-4 h-4 text-primary" />
                      {photographyTitle}
                    </h5>
                    <ul className="space-y-2">
                      {extendedDetails.photographyTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {(extendedDetails.schedule.length > 0 || extendedDetails.lightingTips.length > 0) && (
                <>
                  <Separator className="bg-border/40" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    {extendedDetails.schedule.length > 0 && (
                      <div className="space-y-3 rounded-md border border-border/40 bg-muted/20 p-4">
                        <h5 className="text-sm font-semibold text-foreground tracking-wide uppercase flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          {logisticsTitle}
                        </h5>
                        <ul className="space-y-2">
                          {extendedDetails.schedule.map((item, i) => (
                            <li key={i} className="text-sm text-muted-foreground leading-relaxed">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {extendedDetails.lightingTips.length > 0 && (
                      <div className="space-y-3 rounded-md border border-border/40 bg-muted/20 p-4">
                        <h5 className="text-sm font-semibold text-foreground tracking-wide uppercase flex items-center gap-2">
                          <SunMedium className="w-4 h-4 text-primary" />
                          Luz Ideal
                        </h5>
                        <ul className="space-y-2">
                          {extendedDetails.lightingTips.map((item, i) => (
                            <li key={i} className="text-sm text-muted-foreground leading-relaxed">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              )}

              {hotel.description && (
                <>
                  <Separator className="bg-border/40" />
                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold text-foreground tracking-wide uppercase">Resumo</h5>
                    <p className="text-sm text-muted-foreground/80 leading-relaxed">{hotel.description}</p>
                  </div>
                </>
              )}

              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
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
