import { useState } from "react";
import { Plane, Clock, X } from "lucide-react";

interface FlightCardProps {
  airline: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: string;
  priceEconomy?: string;
  priceBusiness?: string;
  stops: string;
  stopsDetail?: string;
  logoUrl?: string;
  selected?: boolean;
  onSelect?: () => void;
}

const FlightCard = ({
  airline,
  departure,
  arrival,
  departureTime,
  arrivalTime,
  duration,
  price,
  priceEconomy,
  priceBusiness,
  stops,
  stopsDetail,
  logoUrl,
  selected,
  onSelect,
}: FlightCardProps) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<"economy" | "business">("economy");

  const isDirect = stops === "Direto" || stops === "0 paradas";
  const economyPrice = priceEconomy || price;
  const businessPrice = priceBusiness || "Sob consulta";
  const displayPrice = selectedClass === "economy" ? economyPrice : businessPrice;

  const stopsLabel = isDirect ? "Direto" : stops;

  return (
    <>
      {/* ─── CARD ─────────────────────────────────────────────────── */}
      <div
        className={`w-full text-left rounded-lg p-4 transition-all duration-300 border cursor-pointer ${
          selected
            ? "border-primary bg-card shadow-[0_0_20px_hsl(36_90%_55%/_0.15)]"
            : "border-border bg-card hover:border-primary/50 hover:shadow-[0_0_24px_hsl(36_90%_55%/_0.12)]"
        }`}
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={airline}
                className="h-6 w-6 object-contain rounded-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-6 h-6 rounded-sm bg-muted flex items-center justify-center">
                <Plane className="w-3 h-3 text-muted-foreground" />
              </div>
            )}
            <span className="text-sm font-medium text-foreground">{airline}</span>
          </div>

          <span
            className={`text-xs px-2 py-1 rounded-sm border ${
              isDirect
                ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                : "bg-amber-950 text-amber-400 border-amber-800"
            }`}
          >
            {stopsLabel}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="text-center">
            <p className="text-xl font-display font-semibold text-foreground">{departureTime}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{departure}</p>
          </div>
          <div className="flex-1 flex items-center gap-2">
            <div className="h-px flex-1 border-t border-dashed border-border/60" />
            <Plane className="w-3.5 h-3.5 text-primary shrink-0" />
            <div className="h-px flex-1 border-t border-dashed border-border/60" />
          </div>
          <div className="text-center">
            <p className="text-xl font-display font-semibold text-foreground">{arrivalTime}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{arrival}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">{duration}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">a partir de</span>
            <p className="text-lg font-display font-bold text-primary">{economyPrice}</p>
          </div>
        </div>
      </div>

      {/* ─── MODAL DE DETALHES ────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img src={logoUrl} alt={airline} className="h-8 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div className="w-8 h-8 rounded-sm bg-muted flex items-center justify-center">
                    <Plane className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-display text-lg text-foreground tracking-wide">{airline}</p>
                  <p className="text-xs text-muted-foreground">{departure} → {arrival}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-muted/40 rounded-lg p-4 mb-5 flex items-center gap-4">
              <div className="text-center">
                <p className="font-display text-2xl text-foreground tracking-widest">{departure}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Origem</p>
                <p className="text-sm font-medium text-foreground mt-1">{departureTime}</p>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-center w-full gap-2">
                  <div className="h-px flex-1 border-t border-dashed border-border" />
                  <Plane className="w-4 h-4 text-primary" />
                  <div className="h-px flex-1 border-t border-dashed border-border" />
                </div>
                <span className="text-[10px] text-muted-foreground">{duration}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  isDirect ? "text-emerald-400 border-emerald-800 bg-emerald-950" : "text-amber-400 border-amber-800 bg-amber-950"
                }`}>{stopsLabel}</span>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl text-foreground tracking-widest">{arrival}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Destino</p>
                <p className="text-sm font-medium text-foreground mt-1">{arrivalTime}</p>
              </div>
            </div>

            {!isDirect && stopsDetail && (
              <div className="mb-5 p-3 rounded-lg border border-amber-800/40 bg-amber-950/20">
                <p className="text-xs text-amber-400 font-medium mb-1 uppercase tracking-wider">Conexão</p>
                <p className="text-sm text-foreground/80">{stopsDetail}</p>
              </div>
            )}

            <div className="mb-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Classe</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedClass("economy")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedClass === "economy"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <p className="text-xs text-muted-foreground mb-1">Econômica</p>
                  <p className="text-base font-display font-bold text-primary">{economyPrice}</p>
                </button>
                <button
                  onClick={() => setSelectedClass("business")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedClass === "business"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <p className="text-xs text-muted-foreground mb-1">Executiva</p>
                  <p className={`text-base font-display font-bold ${
                    businessPrice === "Sob consulta" ? "text-muted-foreground text-sm" : "text-primary"
                  }`}>{businessPrice}</p>
                </button>
              </div>
            </div>

            <button
              onClick={() => { onSelect?.(); setShowModal(false); }}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              Selecionar {selectedClass === "economy" ? "Econômica" : "Executiva"} — {displayPrice}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FlightCard;
