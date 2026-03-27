import { useState } from "react";
import { Plane, ExternalLink, Sparkles, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ParsedHotel } from "@/lib/parseHotels";

interface FlightTicketCardProps {
  flight: ParsedHotel;
  index: number;
}

const FlightTicketCard = ({ flight }: FlightTicketCardProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const logo = flight.photoUrl;
  const flightsUrl = `https://www.google.com/travel/flights?q=${encodeURIComponent(flight.name + " " + flight.description)}`;

  const routeMatch = flight.description.match(/([A-Z]{3})\s*[✈️➡→\-]+\s*([A-Z]{3})/);
  const origin = routeMatch?.[1] ?? "";
  const destination = routeMatch?.[2] ?? "";
  const hasRoute = origin && destination;

  return (
    <>
      {/* Compact Boarding Pass */}
      <div className="group relative overflow-hidden rounded-lg border border-border/50 bg-card/30 backdrop-blur-xl transition-all duration-200 hover:border-primary/40 hover:shadow-[0_8px_24px_hsl(var(--primary)/0.08)] max-h-[100px]">
        <div className="flex items-center h-[88px]">
          {/* Logo */}
          <div className="flex items-center justify-center w-16 shrink-0 pl-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-border/40 bg-muted flex items-center justify-center shrink-0">
              {logo && !logoError ? (
                <>
                  {!logoLoaded && <Skeleton className="w-10 h-10 rounded-full absolute" />}
                  <img
                    src={logo}
                    alt={flight.name}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${logoLoaded ? "opacity-100" : "opacity-0"}`}
                    onLoad={() => setLogoLoaded(true)}
                    onError={() => setLogoError(true)}
                  />
                </>
              ) : (
                <Plane className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 px-3 py-2">
            {/* Airline name */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate">
                {flight.name}
              </span>
              <Badge className="bg-primary/90 text-primary-foreground border-none text-[8px] uppercase tracking-wider px-1.5 py-0 h-4 shrink-0">
                Voo
              </Badge>
            </div>

            {/* Route - centered and bold */}
            {hasRoute ? (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-[0.12em] text-foreground font-mono">
                  {origin}
                </span>
                <div className="flex items-center gap-0.5 text-primary">
                  <div className="w-4 h-px bg-primary/40" />
                  <Plane className="w-3.5 h-3.5" />
                  <div className="w-4 h-px bg-primary/40" />
                </div>
                <span className="text-lg font-bold tracking-[0.12em] text-foreground font-mono">
                  {destination}
                </span>
              </div>
            ) : (
              <p className="text-xs text-foreground/80 truncate">{flight.description}</p>
            )}

            {/* Price */}
            <span className="text-xs font-semibold text-primary font-mono mt-0.5 block">
              {flight.price}
            </span>
          </div>

          {/* Dashed separator */}
          <div className="h-full border-l border-dashed border-border/30 hidden sm:block" />

          {/* Actions stub */}
          <div className="flex flex-col items-center justify-center gap-1.5 px-3 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="text-[10px] h-6 px-2 text-muted-foreground hover:text-primary"
              onClick={() => setDetailsOpen(true)}
            >
              Detalhes
            </Button>
            <a
              href={flightsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] h-6 px-2 rounded-md text-primary hover:bg-primary/10 transition-colors font-medium"
            >
              <Search className="w-3 h-3" />
              Preços
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
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
              {hasRoute && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 flex items-center justify-center gap-6">
                  <div className="text-center">
                    <span className="block text-4xl font-bold tracking-[0.2em] text-foreground font-mono">{origin}</span>
                    <span className="text-xs text-muted-foreground uppercase">Origem</span>
                  </div>
                  <div className="flex items-center gap-2 text-primary">
                    <div className="w-10 h-px bg-primary/40" />
                    <Plane className="w-6 h-6" />
                    <div className="w-10 h-px bg-primary/40" />
                  </div>
                  <div className="text-center">
                    <span className="block text-4xl font-bold tracking-[0.2em] text-foreground font-mono">{destination}</span>
                    <span className="text-xs text-muted-foreground uppercase">Destino</span>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">Preço estimado</p>
                  <span className="text-3xl font-bold text-primary tracking-tight">{flight.price}</span>
                </div>
                <Badge className="bg-primary/90 text-primary-foreground border-none text-xs">{flight.badge}</Badge>
              </div>

              <Separator className="bg-border/40" />

              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-primary uppercase tracking-widest">Análise do Voya</h5>
                <div className="text-[15px] text-muted-foreground/90 leading-[1.85] whitespace-pre-line">{flight.detailsText}</div>
              </div>

              <a
                href={flightsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Search className="w-4 h-4 mr-2" />
                Pesquisar Preços no Google Flights
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
