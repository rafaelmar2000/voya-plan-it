import { useState, useMemo } from "react";
import { Plane, ExternalLink, Search, Check, Clock, MapPin, CircleDot } from "lucide-react";
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
import { parseFlightMeta, type FlightClassPrice } from "@/lib/parseFlightDetails";
import { useMyTrip } from "@/contexts/MyTripContext";

interface FlightTicketCardProps {
  flight: ParsedHotel;
  index: number;
}

const FlightTicketCard = ({ flight }: FlightTicketCardProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>("Econômica");
  const { addItem, removeItem, isSelected, getItem } = useMyTrip();

  const meta = useMemo(() => {
    console.log("[DEBUG flight.description]", flight.description);
    console.log("[DEBUG flight.detailsText]", flight.detailsText);
    const parsed = parseFlightMeta(flight.description, flight.detailsText);
    console.log("[FlightTicketCard] Parsed meta for", flight.name, parsed);
    return parsed;
  }, [flight.description, flight.detailsText, flight.name]);

  const logo = flight.photoUrl;
  const flightsUrl = `https://www.google.com/travel/flights?q=${encodeURIComponent(flight.name + " " + flight.description)}`;

  const routeMatch = flight.description.match(/([A-Z]{3})\s*[✈️➡→\-]+\s*([A-Z]{3})/);
  const origin = routeMatch?.[1] ?? "";
  const destination = routeMatch?.[2] ?? "";
  const hasRoute = origin && destination;

  // Get price for the currently selected class
  const activeClassPrice: FlightClassPrice | undefined = meta.classPrices.find(
    (cp) => cp.className.toLowerCase() === selectedClass.toLowerCase()
  );
  const displayPrice = activeClassPrice?.price ?? flight.price;

  const selected = isSelected(flight.name);
  const tripItem = getItem(flight.name);

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selected) {
      if (tripItem) removeItem(tripItem.id);
    } else {
      // Build a modified flight item with the correct class price
      const flightWithClassPrice: ParsedHotel = {
        ...flight,
        price: displayPrice,
      };
      addItem(flightWithClassPrice, selectedClass);
    }
  };

  const handleSelectWithClass = () => {
    if (tripItem) removeItem(tripItem.id);
    const flightWithClassPrice: ParsedHotel = {
      ...flight,
      price: activeClassPrice?.price ?? flight.price,
    };
    addItem(flightWithClassPrice, selectedClass);
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

          {/* Route + meta info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {hasRoute ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold tracking-wider text-foreground font-mono">{origin}</span>
                  <Plane className="w-3 h-3 text-primary" />
                  <span className="text-sm font-bold tracking-wider text-foreground font-mono">{destination}</span>
                </div>
              ) : (
                <p className="text-sm text-foreground truncate">{flight.name}</p>
              )}
              <span className="text-[10px] text-muted-foreground border border-border/20 px-1.5 py-0.5 rounded-sm">
                {meta.connectionLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                {meta.flightNumber && <span>{meta.flightNumber}</span>}
                {meta.flightNumber && meta.schedule && <span>·</span>}
                {meta.schedule && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {meta.schedule}
                  </span>
                )}
              </p>
              {/* Class badges */}
              {meta.classPrices.length > 0 && (
                <div className="flex items-center gap-1">
                  {meta.classPrices.map((cp) => (
                    <span
                      key={cp.className}
                      className={`text-[9px] px-1.5 py-0.5 rounded-sm border transition-colors cursor-default ${
                        selectedClass === cp.className
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border/20 text-muted-foreground"
                      }`}
                    >
                      {cp.className}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Price */}
          <span className="text-sm font-bold text-primary font-mono shrink-0">
            {displayPrice}
          </span>
        </button>

        {/* Quick select */}
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
                {meta.flightNumber && <span className="text-xs">· {meta.flightNumber}</span>}
              </DialogDescription>
            )}
          </DialogHeader>

          <ScrollArea className="h-[70vh]">
            <div className="space-y-6 px-6 pb-6 pt-4">
              {/* Route visual */}
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

              {/* Connections Timeline */}
              {meta.connections.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-primary uppercase tracking-widest">Conexões</h5>
                  <div className="relative pl-5 space-y-4">
                    {/* Vertical line */}
                    <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border/40" />

                    {/* Origin */}
                    <div className="flex items-center gap-3 relative">
                      <Plane className="w-3.5 h-3.5 text-primary shrink-0 relative z-10 bg-background" />
                      <span className="text-sm text-foreground font-medium">{origin || "Partida"}</span>
                    </div>

                    {/* Stops */}
                    {meta.connections.map((conn, i) => (
                      <div key={i} className="flex items-start gap-3 relative">
                        <CircleDot className="w-3.5 h-3.5 text-accent shrink-0 relative z-10 bg-background mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm text-foreground">{conn.city}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span className="text-[11px]">Espera: {conn.waitTime}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Destination */}
                    <div className="flex items-center gap-3 relative">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0 relative z-10 bg-background" />
                      <span className="text-sm text-foreground font-medium">{destination || "Destino"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Class Selection with Prices */}
              <div className="space-y-2">
                <h5 className="text-sm font-semibold text-primary uppercase tracking-widest">Classe</h5>
                <div className="grid grid-cols-2 gap-2">
                  {["Econômica", "Executiva"].map((cls) => {
                    const cp = meta.classPrices.find(
                      (p) => p.className.toLowerCase() === cls.toLowerCase()
                    );
                    return (
                      <button
                        key={cls}
                        onClick={() => setSelectedClass(cls)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedClass === cls
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <p className="text-xs text-muted-foreground mb-1">{cls}</p>
                        <p className={`text-base font-display font-bold ${
                          cp ? "text-primary" : "text-muted-foreground text-sm"
                        }`}>
                          {cp ? cp.price : "Sob consulta"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price display */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">
                    {selectedClass}
                  </p>
                  <span className="text-3xl font-bold text-primary tracking-tight">{displayPrice}</span>
                </div>
                <Badge className="bg-primary/90 text-primary-foreground border-none text-xs">{meta.connectionLabel}</Badge>
              </div>

              <Separator className="bg-border/40" />

              <div className="space-y-2">
                <h5 className="text-sm font-semibold text-primary uppercase tracking-widest">Detalhes do Voo</h5>
                {flight.detailsText
                  .split("\n")
                  .filter((line) => line.trim())
                  .map((line, i) => {
                    if (/^(PRECO_|PREÇO_|LOGÍSTICA:|LOGISTICA:)/i.test(line.trim())) return null;
                    return (
                      <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                        {line}
                      </p>
                    );
                  })}
                {(() => {
                  const logMatch = flight.detailsText.match(/LOG[ÍI]STICA:\s*(.+)/i);
                  return logMatch ? (
                    <div className="mt-2 p-3 rounded-lg bg-muted/30 border border-border/40">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Logística</p>
                      <p className="text-sm text-foreground/80">{logMatch[1]}</p>
                    </div>
                  ) : null;
                })()}
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

              {/* Google Flights link */}
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
