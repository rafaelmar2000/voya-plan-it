import { useNavigate } from "react-router-dom";
import { useMyTrip, type TripItem } from "@/contexts/MyTripContext";
import { ArrowLeft, Download, Plane, Hotel, UtensilsCrossed, Compass, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState, useRef } from "react";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&h=340&fit=crop&q=80";
const RESTAURANT_FALLBACK = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800";

function isBadLocation(loc: string | undefined | null): boolean {
  if (!loc) return true;
  if (loc.length < 8) return true;
  if (/24h|fecha|abre\b|^ia$/i.test(loc)) return true;
  if (loc.startsWith("http") || loc.includes("%") || loc.includes("-gj_") || loc.includes("gps-cs") || loc.length > 60) return true;
  return false;
}

function groupByKind(items: TripItem[]) {
  const flights = items.filter(i => i.item.kind === "flight");
  const hotels = items.filter(i => i.item.kind === "hotel" || i.item.kind === "generic");
  const restaurants = items.filter(i => i.item.kind === "restaurant");
  const attractions = items.filter(i => i.item.kind === "attraction");
  return { flights, hotels, restaurants, attractions };
}

function extractTripName(items: TripItem[]): string {
  const flight = items.find(i => i.item.kind === "flight");
  if (flight) {
    const desc = flight.item.description || "";
    const match = desc.match(/([A-Z]{3})\s*[✈️➡→\->]+\s*([A-Z]{3})/);
    if (match) return `${match[1]} → ${match[2]}`;
    return flight.item.name;
  }
  const hotel = items.find(i => i.item.kind === "hotel");
  if (hotel?.item.location && !isBadLocation(hotel.item.location)) return `Viagem para ${hotel.item.location}`;
  return "Meu Roteiro de Viagem";
}

function getImageForItem(item: TripItem): string {
  if (item.item.photoUrl) return item.item.photoUrl;
  if (item.item.kind === "restaurant") return RESTAURANT_FALLBACK;
  return FALLBACK_IMAGE;
}

function getCategoryTotal(items: TripItem[]): number {
  return items.reduce((sum, i) => sum + i.priceNumeric, 0);
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getDisplayLocation(item: TripItem["item"]): string | null {
  if (item.kind === "restaurant" && item.description) {
    const loc = item.description.split("|")[0]?.trim();
    return isBadLocation(loc) ? null : loc;
  }
  return isBadLocation(item.location) ? null : item.location;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  items: TripItem[];
  subtotal: number;
  isEstimate?: boolean;
}

const Section = ({ title, icon, items, subtotal, isEstimate }: SectionProps) => {
  if (items.length === 0) return null;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground font-['Bebas_Neue'] tracking-wider uppercase">{title}</h2>
          <p className="text-xs text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "itens"} · Subtotal: {formatCurrency(subtotal)}
            {isEstimate && <span className="text-muted-foreground/60 ml-1">(estimativa)</span>}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((ti) => (
          <ItemCard key={ti.id} tripItem={ti} />
        ))}
      </div>
    </div>
  );
};

const ItemCard = ({ tripItem }: { tripItem: TripItem }) => {
  const item = tripItem.item;
  const image = getImageForItem(tripItem);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name + (item.location ? " " + item.location : ""))}`;
  const displayLocation = getDisplayLocation(item);

  return (
    <div className="rounded-lg border border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden hover:border-primary/30 transition-all">
      <div className="relative h-36 overflow-hidden">
        <img
          src={image}
          alt={item.name}
          className="w-full h-full object-cover"
          crossOrigin="anonymous"
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute bottom-2 right-2 bg-background/60 backdrop-blur-md border border-border/30 rounded px-2.5 py-1">
          <span className="text-sm font-bold text-primary">{item.price.replace(/\/noite/gi, "").trim()}</span>
          {item.kind === "hotel" && <span className="text-[10px] text-muted-foreground ml-1">/noite</span>}
        </div>
        {tripItem.selectedClass && (
          <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px] uppercase tracking-wider px-2 py-0.5 rounded">
            {tripItem.selectedClass}
          </div>
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <h4 className="font-semibold text-foreground text-sm">{item.name}</h4>
        {displayLocation && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0" />
            {displayLocation}
          </p>
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
        >
          Abrir no Maps <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};

/* ─── Cover page component (rendered off-screen for PDF capture) ─── */
const PdfCover = ({ tripName, totalBudget }: { tripName: string; totalBudget: number }) => {
  const today = new Date().toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" });
  return (
    <div
      id="pdf-cover"
      style={{
        width: 794,
        minHeight: 1123,
        background: "#0A0A0A",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        fontFamily: "'Inter', 'Helvetica', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* SVG decorative borders */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} viewBox="0 0 794 1123" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Corner brackets */}
        <path d="M40 40 L100 40" stroke="#F5A623" strokeWidth="2" />
        <path d="M40 40 L40 100" stroke="#F5A623" strokeWidth="2" />
        <path d="M694 40 L754 40" stroke="#F5A623" strokeWidth="2" />
        <path d="M754 40 L754 100" stroke="#F5A623" strokeWidth="2" />
        <path d="M40 1023 L40 1083" stroke="#F5A623" strokeWidth="2" />
        <path d="M40 1083 L100 1083" stroke="#F5A623" strokeWidth="2" />
        <path d="M754 1023 L754 1083" stroke="#F5A623" strokeWidth="2" />
        <path d="M694 1083 L754 1083" stroke="#F5A623" strokeWidth="2" />
        {/* Geometric vertical lines */}
        {[0, 1, 2, 3, 4].map(i => (
          <line key={`l${i}`} x1={60 + i * 12} y1={200} x2={60 + i * 12} y2={350} stroke="#F5A623" strokeWidth="0.7" opacity="0.4" />
        ))}
        {[0, 1, 2, 3, 4].map(i => (
          <line key={`r${i}`} x1={734 - i * 12} y1={200} x2={734 - i * 12} y2={350} stroke="#F5A623" strokeWidth="0.7" opacity="0.4" />
        ))}
        {/* Skyline at bottom */}
        <path d="M0 980 L60 980 L60 940 L90 940 L90 960 L130 960 L130 920 L150 900 L170 920 L170 960 L220 960 L220 930 L250 930 L250 950 L300 950 L300 910 L310 890 L320 910 L320 940 L370 940 L370 960 L420 960 L420 935 L440 920 L460 935 L460 960 L510 960 L510 940 L550 940 L550 925 L570 910 L590 925 L590 950 L640 950 L640 930 L680 930 L680 960 L730 960 L730 940 L794 940 L794 1123 L0 1123 Z" fill="#F5A623" opacity="0.06" />
        {/* Diamond divider */}
        <line x1={150} y1={561} x2={370} y2={561} stroke="#F5A623" strokeWidth="1" />
        <line x1={424} y1={561} x2={644} y2={561} stroke="#F5A623" strokeWidth="1" />
        <polygon points="397,551 407,561 397,571 387,561" fill="#F5A623" />
      </svg>

      <div style={{ zIndex: 1, textAlign: "center", padding: "0 60px" }}>
        <div style={{ fontSize: 14, letterSpacing: 6, color: "#F5A623", marginBottom: 30, opacity: 0.7 }}>VOYA</div>
        <h1 style={{ fontSize: 48, fontWeight: 700, color: "#F5A623", letterSpacing: 4, margin: "0 0 24px" }}>ROTEIRO DE VIAGEM</h1>
        <p style={{ fontSize: 24, color: "#fff", margin: "0 0 60px", fontWeight: 300 }}>{tripName}</p>
        <div style={{ height: 30 }} />
        <p style={{ fontSize: 13, color: "#999", margin: "40px 0 8px" }}>Planejado em {today}</p>
        <p style={{ fontSize: 12, color: "#F5A623", margin: "0 0 60px" }}>VOYA — Seu assistente de viagem inteligente</p>
        <div style={{ marginTop: 40 }}>
          <p style={{ fontSize: 14, color: "#F5A623", letterSpacing: 3, marginBottom: 8 }}>ORÇAMENTO TOTAL ESTIMADO</p>
          <p style={{ fontSize: 40, fontWeight: 700, color: "#F5A623", margin: 0 }}>{formatCurrency(totalBudget)}</p>
        </div>
      </div>
    </div>
  );
};

const Roteiro = () => {
  const navigate = useNavigate();
  const { items, totalBudget } = useMyTrip();
  const [generating, setGenerating] = useState(false);
  const [showCover, setShowCover] = useState(false);
  const coverRef = useRef<HTMLDivElement>(null);

  const { flights, hotels, restaurants, attractions } = groupByKind(items);
  const tripName = extractTripName(items);

  const handleDownloadPdf = async () => {
    setGenerating(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      // Show cover temporarily
      setShowCover(true);
      await new Promise(r => setTimeout(r, 300));

      const doc = new jsPDF("p", "mm", "a4");
      const pdfW = 210;
      const pdfH = 297;

      // ─── Capture cover ───
      const coverEl = document.getElementById("pdf-cover");
      if (coverEl) {
        const coverCanvas = await html2canvas(coverEl, {
          backgroundColor: "#0A0A0A",
          scale: 2,
          useCORS: true,
          logging: false,
        });
        const coverImg = coverCanvas.toDataURL("image/jpeg", 0.95);
        doc.addImage(coverImg, "JPEG", 0, 0, pdfW, pdfH);
      }

      // ─── Capture content ───
      const contentEl = document.getElementById("roteiro-content");
      if (contentEl) {
        const contentCanvas = await html2canvas(contentEl, {
          backgroundColor: "#0A0A0A",
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: 900,
        });

        const imgData = contentCanvas.toDataURL("image/jpeg", 0.92);
        const imgW = pdfW;
        const imgH = (contentCanvas.height * pdfW) / contentCanvas.width;

        // Split into pages
        const pageContentH = pdfH;
        let offsetY = 0;
        let first = true;

        while (offsetY < imgH) {
          if (!first || coverEl) doc.addPage();
          first = false;

          // Use a canvas slice for each page
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = contentCanvas.width;
          const sliceH = Math.min(
            (pageContentH / pdfW) * contentCanvas.width,
            contentCanvas.height - (offsetY / imgH) * contentCanvas.height
          );
          sliceCanvas.height = sliceH;
          const ctx = sliceCanvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(
              contentCanvas,
              0, (offsetY / imgH) * contentCanvas.height,
              contentCanvas.width, sliceH,
              0, 0,
              contentCanvas.width, sliceH,
            );
            const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.92);
            const sliceDisplayH = (sliceH * pdfW) / contentCanvas.width;
            doc.addImage(sliceData, "JPEG", 0, 0, imgW, sliceDisplayH);
          }

          offsetY += pageContentH;
        }
      }

      setShowCover(false);
      doc.save("roteiro-voya.pdf");
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      setShowCover(false);
    } finally {
      setGenerating(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground text-sm">Nenhum item selecionado no roteiro.</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Chat
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Off-screen cover for PDF */}
      {showCover && (
        <div ref={coverRef} style={{ position: "fixed", left: "-9999px", top: 0, zIndex: -1 }}>
          <PdfCover tripName={tripName} totalBudget={totalBudget} />
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground font-['Bebas_Neue'] tracking-wider uppercase">{tripName}</h1>
              <p className="text-xs text-muted-foreground">{items.length} itens selecionados</p>
            </div>
          </div>
          <Button
            onClick={handleDownloadPdf}
            disabled={generating}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            <Download className="w-4 h-4" />
            {generating ? "Gerando..." : "Baixar PDF"}
          </Button>
        </div>
      </div>

      {/* Content (captured by html2canvas) */}
      <div id="roteiro-content" className="max-w-4xl mx-auto px-6 py-8 space-y-10">
        <Section title="Voos" icon={<Plane className="w-5 h-5" />} items={flights} subtotal={getCategoryTotal(flights)} />
        <Section title="Hotéis" icon={<Hotel className="w-5 h-5" />} items={hotels} subtotal={getCategoryTotal(hotels)} />
        <Section title="Restaurantes" icon={<UtensilsCrossed className="w-5 h-5" />} items={restaurants} subtotal={getCategoryTotal(restaurants)} isEstimate />
        <Section title="Atrações" icon={<Compass className="w-5 h-5" />} items={attractions} subtotal={getCategoryTotal(attractions)} />

        {/* Budget Summary */}
        <Separator className="bg-border/40" />
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground font-['Bebas_Neue'] tracking-wider uppercase">Resumo do Orçamento</h2>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 space-y-3">
            {[
              { label: "Voos", total: getCategoryTotal(flights), count: flights.length },
              { label: "Hotéis", total: getCategoryTotal(hotels), count: hotels.length },
              { label: "Restaurantes", total: getCategoryTotal(restaurants), count: restaurants.length },
              { label: "Atrações", total: getCategoryTotal(attractions), count: attractions.length },
            ].filter(r => r.count > 0).map(r => (
              <div key={r.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{r.label} ({r.count})</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(r.total)}
                  {r.label === "Restaurantes" && <span className="text-xs text-muted-foreground ml-1">(estimativa)</span>}
                </span>
              </div>
            ))}
            <Separator className="bg-primary/20" />
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-foreground">Total Estimado</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(totalBudget)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Roteiro;
