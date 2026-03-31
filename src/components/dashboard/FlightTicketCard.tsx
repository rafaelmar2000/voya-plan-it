import { useState } from "react";
import { Plane, ExternalLink, Search, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { useMyTrip } from "@/contexts/MyTripContext";

interface FlightTicketCardProps {
  flight: ParsedHotel;
  index: number;
}

const FLIGHT_CLASSES = ["Econômica", "Executiva"] as const;

const FlightTicketCard = ({ flight }: FlightTicketCardProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>("Econômica");
  const { addItem, removeItem, isSelected, getItem } = useMyTrip();

  const logo = flight.photoUrl;
  const flightsUrl = `https://www.google.com/travel/flights?q=${encodeURIComponent(flight.name + " " + flight.description)}`;

  const routeMatch = flight.description.match(/([A-Z]{3})\s*[✈️➡→\-]+\s*([A-Z]{3})/);
  const origin = routeMatch?.[1] ?? "";
  const destination = routeMatch?.[2] ?? "";
  const hasRoute = origin && destination;

  const extraInfo = flight.description
    .replace(/([A-Z]{3})\s*[✈️➡→\-]+\s*([A-Z]{3})/, "")
    .replace(/^[\s,\-–|]+/, "")
    .trim();

  const selected = isSelected(flight.name);
  const tripItem = getItem(flight.name);

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selected) {
      if (tripItem) removeItem(tripItem.id);
    } else {
      addItem(flight);
    }
  };

  const handleSelectWithClass = () => {
    // Remove any existing selection for this flight
    if (tripItem) removeItem(tripItem.id);
    addItem(flight, selectedClass);
    setDetailsOpen(false);
  };

  return (
    <>
      <div className="w-full flex items-center gap-1">
        <button
          onClick={() => setDetailsOpen(true)}
          className="flex-1 group flex items-center gap-3 rounded-md border border-border/20 bg-card/20 px-3 py-2 transition-colors duration-150 hover:bg-muted/30 text-left"
        >
          {/* Logo */}
          <div className="w-8 h-8 rounded-full overflow-hidden border border-border/30 bg-muted flex items-center justify-center shrink-0">
            {logo && !logoError ? (
              <>
                {!logoLoaded && <Skeleton className="w-8 h-8 rounded-full absolute" />}
                <img
                  src={logo}
                  alt={flight.name}
                  className={`w-full h-full object-cover transition-opacity duration-200 ${logoLoaded ? "opacity-100" : "opacity-0"}`}
                  onLoad={() => setLogoLoaded(true)}
                  onError={() => setLogoError(true)}
                />
              </>
            ) : (
              <Plane className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </div>

          {/* Route + details */}
          <div className="flex-1 min-w-0">
            {hasRoute ? (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-wider text-foreground font-mono">{origin}</span>
                <Plane className="w-3 h-3 text-primary" />
                <span className="text-sm font-bold tracking-wider text-foreground font-mono">{destination}</span>
              </div>
            ) : (
              <p className="text-sm text-foreground truncate">{flight.name}</p>
            )}
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {extraInfo || flight.name}
            </p>
          </div>

          {/* Price */}
          <span className="text-sm font-bold text-primary font-mono shrink-0">
            {flight.price}
          </span>
        </button>

        {/* Quick select button */}
        <button
          onClick={handleSelect}
          className={`shrink-0 h-9 w-9 rounded-md flex items-center justify-center transition-colors duration-150 ${
            selected
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-muted/30 text-muted-foreground border border-border/20 hover:border-primary/40 hover:text-primary"
          }`}
          title={selected ? "Selecionado" : "Selecionar para meu Roteiro"}
        >
          {selected ? <Check className="w-4 h-4" /> : <span className="text-lg leading-none">+</span>}
        </button>
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

              {/* Price */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">Preço estimado</p>
                  <span className="text-3xl font-bold text-primary tracking-tight">{flight.price}</span>
                </div>
                <Badge className="bg-primary/90 text-primary-foreground border-none text-xs">{flight.badge}</Badge>
              </div>

              {/* Class selection */}
              <div className="space-y-2">
                <h5 className="text-sm font-semibold text-primary uppercase tracking-widest">Classe</h5>
                <div className="flex gap-2">
                  {FLIGHT_CLASSES.map((cls) => (
                    <button
                      key={cls}
                      onClick={() => setSelectedClass(cls)}
                      className={`flex-1 py-2.5 rounded-md text-xs font-medium border transition-colors ${
                        selectedClass === cls
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/30 bg-muted/20 text-muted-foreground hover:border-border/50"
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="bg-border/40" />

              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-primary uppercase tracking-widest">Análise do Voya</h5>
                <div className="text-[15px] text-muted-foreground/90 leading-[1.85] whitespace-pre-line">{flight.detailsText}</div>
              </div>

              {/* Select for trip */}
              <button
                onClick={handleSelectWithClass}
                className={`w-full h-10 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  selected
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
                }`}
              >
                <Check className="w-4 h-4" />
                {selected ? "Selecionado — Alterar Classe" : `Selecionar ${selectedClass} para meu Roteiro`}
              </button>

              {/* Search link */}
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
