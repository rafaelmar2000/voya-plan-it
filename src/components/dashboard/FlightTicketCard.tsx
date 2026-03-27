import { useState } from "react";
import { Plane, ExternalLink, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ParsedHotel } from "@/lib/parseHotels";

const FALLBACK_LOGO =
  "https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=120&h=120&fit=crop&q=80";

interface FlightTicketCardProps {
  flight: ParsedHotel;
  index: number;
}

const FlightTicketCard = ({ flight }: FlightTicketCardProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const logo = flight.photoUrl || FALLBACK_LOGO;
  const flightsUrl = `https://www.google.com/travel/flights?q=${encodeURIComponent(flight.name + " " + flight.description)}`;

  // Try to extract route like "GRU ✈️ CDG" from the summary
  const routeMatch = flight.description.match(/([A-Z]{3})\s*[✈️➡→\-]+\s*([A-Z]{3})/);
  const origin = routeMatch?.[1] ?? "";
  const destination = routeMatch?.[2] ?? "";
  const hasRoute = origin && destination;

  return (
    <>
      {/* Boarding Pass Card */}
      <div className="group relative overflow-hidden rounded-lg border border-border/50 bg-card/30 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_12px_40px_hsl(var(--primary)/0.10)]">
        {/* Dashed perforation line */}
        <div className="absolute top-0 bottom-0 right-[72px] border-r border-dashed border-border/30 hidden sm:block" />

        <div className="flex items-stretch min-h-[140px]">
          {/* Main ticket area */}
          <div className="flex-1 p-4 flex flex-col justify-between gap-3">
            {/* Airline + badge */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-border/40 bg-muted shrink-0">
                <img
                  src={logo}
                  alt={flight.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_LOGO; }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider truncate">
                {flight.name}
              </span>
              <Badge className="ml-auto bg-primary/90 text-primary-foreground border-none text-[9px] uppercase tracking-wider px-2 py-0.5 shrink-0">
                <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                Voo
              </Badge>
            </div>

            {/* Route display */}
            {hasRoute ? (
              <div className="flex items-center justify-center gap-3 py-1">
                <div className="text-center">
                  <span className="block text-2xl font-bold tracking-[0.15em] text-foreground font-mono">
                    {origin}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase">Partida</span>
                </div>
                <div className="flex items-center gap-1 text-primary">
                  <div className="w-8 h-px bg-primary/40" />
                  <Plane className="w-5 h-5 rotate-0" />
                  <div className="w-8 h-px bg-primary/40" />
                </div>
                <div className="text-center">
                  <span className="block text-2xl font-bold tracking-[0.15em] text-foreground font-mono">
                    {destination}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase">Chegada</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground/80 leading-relaxed line-clamp-2">
                {flight.description}
              </p>
            )}

            {/* Price + actions */}
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary font-mono tracking-tight">
                {flight.price}
              </span>
              <div className="ml-auto flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 border-border/50 hover:border-primary/50 hover:bg-primary/5"
                  onClick={() => setDetailsOpen(true)}
                >
                  Ver Detalhes
                </Button>
                <a
                  href={flightsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center text-xs h-7 px-2.5 rounded-md text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                >
                  <Plane className="w-3 h-3 mr-1" />
                  Flights
                  <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Stub / tear-off section */}
          <div className="hidden sm:flex w-[72px] flex-col items-center justify-center bg-primary/5 border-l border-dashed border-border/30 p-2">
            <Plane className="w-5 h-5 text-primary rotate-90 mb-1" />
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium [writing-mode:vertical-lr] rotate-180">
              Boarding
            </span>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-background border-border/50 max-w-lg p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-0 text-left">
            <DialogTitle className="text-foreground text-xl font-semibold tracking-tight flex items-center gap-2">
              <Plane className="w-5 h-5 text-primary" />
              {flight.name}
            </DialogTitle>
            {hasRoute && (
              <DialogDescription className="flex items-center gap-2 text-muted-foreground text-sm font-mono">
                {origin} → {destination}
              </DialogDescription>
            )}
          </DialogHeader>

          <ScrollArea className="h-[70vh]">
            <div className="space-y-6 px-6 pb-6 pt-4">
              {/* Route hero */}
              {hasRoute && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 flex items-center justify-center gap-6">
                  <div className="text-center">
                    <span className="block text-4xl font-bold tracking-[0.2em] text-foreground font-mono">
                      {origin}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase">Origem</span>
                  </div>
                  <div className="flex items-center gap-2 text-primary">
                    <div className="w-10 h-px bg-primary/40" />
                    <Plane className="w-6 h-6" />
                    <div className="w-10 h-px bg-primary/40" />
                  </div>
                  <div className="text-center">
                    <span className="block text-4xl font-bold tracking-[0.2em] text-foreground font-mono">
                      {destination}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase">Destino</span>
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">
                    Preço estimado
                  </p>
                  <span className="text-3xl font-bold text-primary tracking-tight">
                    {flight.price}
                  </span>
                </div>
                <Badge className="bg-primary/90 text-primary-foreground border-none text-xs">
                  {flight.badge}
                </Badge>
              </div>

              <Separator className="bg-border/40" />

              {/* Análise do Voya */}
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-primary uppercase tracking-widest">
                  Análise do Voya
                </h5>
                <div className="text-[15px] text-muted-foreground/90 leading-[1.85] whitespace-pre-line">
                  {flight.detailsText}
                </div>
              </div>

              {/* Google Flights button */}
              <a
                href={flightsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Plane className="w-4 h-4 mr-2" />
                Buscar no Google Flights
                <ExternalLink className="w-3.5 h-3.5 ml-2" />
              </a>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FlightTicketCard;
