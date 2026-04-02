import { useNavigate } from "react-router-dom";
import { useMyTrip, type TripItem } from "@/contexts/MyTripContext";
import { ArrowLeft, Download, Plane, Hotel, UtensilsCrossed, Compass, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&h=340&fit=crop&q=80";
const RESTAURANT_FALLBACK = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800";

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
  if (hotel?.item.location) return `Viagem para ${hotel.item.location}`;
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

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  items: TripItem[];
  subtotal: number;
}

const Section = ({ title, icon, items, subtotal }: SectionProps) => {
  if (items.length === 0) return null;
  return (
    <div className="space-y-4" id={`section-${title.toLowerCase()}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground font-['Bebas_Neue'] tracking-wider uppercase">{title}</h2>
          <p className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? "item" : "itens"} · Subtotal: {formatCurrency(subtotal)}</p>
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

  const displayLocation = item.kind === "restaurant" && item.description
    ? item.description.split("|")[0]?.trim()
    : item.location || null;

  return (
    <div className="rounded-lg border border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden hover:border-primary/30 transition-all">
      <div className="relative h-36 overflow-hidden">
        <img
          src={image}
          alt={item.name}
          className="w-full h-full object-cover"
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

const Roteiro = () => {
  const navigate = useNavigate();
  const { items, totalBudget } = useMyTrip();
  const [generating, setGenerating] = useState(false);

  const { flights, hotels, restaurants, attractions } = groupByKind(items);
  const tripName = extractTripName(items);

  const handleDownloadPdf = async () => {
    setGenerating(true);
    try {
      const { default: jsPDF } = await import("jspdf");

      const doc = new jsPDF("p", "mm", "a4");
      const W = 210;
      const H = 297;
      const GOLD = "#F5A623";
      const BG = "#0A0A0A";
      const WHITE = "#FFFFFF";
      const GRAY = "#999999";

      // Helper
      const drawDecoCorners = (page: number) => {
        doc.setPage(page);
        doc.setDrawColor(GOLD);
        doc.setLineWidth(0.5);
        // Top-left
        doc.line(10, 10, 30, 10);
        doc.line(10, 10, 10, 30);
        // Top-right
        doc.line(W - 10, 10, W - 30, 10);
        doc.line(W - 10, 10, W - 10, 30);
        // Bottom-left
        doc.line(10, H - 10, 30, H - 10);
        doc.line(10, H - 10, 10, H - 30);
        // Bottom-right
        doc.line(W - 10, H - 10, W - 30, H - 10);
        doc.line(W - 10, H - 10, W - 10, H - 30);
      };

      const drawDiamondDivider = (y: number) => {
        doc.setDrawColor(GOLD);
        doc.setLineWidth(0.3);
        doc.line(30, y, W / 2 - 5, y);
        doc.line(W / 2 + 5, y, W - 30, y);
        // Diamond
        doc.setFillColor(GOLD);
        const cx = W / 2, cy = y;
        doc.triangle(cx, cy - 2.5, cx + 2.5, cy, cx, cy + 2.5, "F");
        doc.triangle(cx, cy - 2.5, cx - 2.5, cy, cx, cy + 2.5, "F");
      };

      // ─── COVER PAGE ───
      doc.setFillColor(BG);
      doc.rect(0, 0, W, H, "F");
      drawDecoCorners(1);

      // Geometric deco lines
      doc.setDrawColor(GOLD);
      doc.setLineWidth(0.2);
      for (let i = 0; i < 5; i++) {
        doc.line(15 + i * 3, 50, 15 + i * 3, 80);
        doc.line(W - 15 - i * 3, 50, W - 15 - i * 3, 80);
      }

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(32);
      doc.setTextColor(GOLD);
      doc.text("ROTEIRO DE VIAGEM", W / 2, 110, { align: "center" });

      doc.setFontSize(18);
      doc.setTextColor(WHITE);
      doc.text(tripName, W / 2, 130, { align: "center" });

      drawDiamondDivider(145);

      doc.setFontSize(11);
      doc.setTextColor(GRAY);
      const today = new Date().toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" });
      doc.text(`Planejado em ${today}`, W / 2, 158, { align: "center" });

      doc.setFontSize(10);
      doc.setTextColor(GOLD);
      doc.text("VOYA — Seu assistente de viagem inteligente", W / 2, 172, { align: "center" });

      // Budget on cover
      doc.setFontSize(14);
      doc.setTextColor(GOLD);
      doc.text("ORÇAMENTO TOTAL ESTIMADO", W / 2, 200, { align: "center" });
      doc.setFontSize(28);
      doc.text(formatCurrency(totalBudget), W / 2, 215, { align: "center" });

      // ─── CONTENT PAGES ───
      const sections = [
        { title: "VOOS", items: flights, icon: "✈️" },
        { title: "HOTÉIS", items: hotels, icon: "🏨" },
        { title: "RESTAURANTES", items: restaurants, icon: "🍽️" },
        { title: "ATRAÇÕES", items: attractions, icon: "🎯" },
      ].filter(s => s.items.length > 0);

      let currentY = 0;
      let pageNum = 1;

      const newContentPage = () => {
        doc.addPage();
        pageNum++;
        doc.setFillColor(BG);
        doc.rect(0, 0, W, H, "F");
        drawDecoCorners(pageNum);
        currentY = 25;
      };

      const checkSpace = (needed: number) => {
        if (currentY + needed > H - 25) newContentPage();
      };

      for (const section of sections) {
        newContentPage();

        // Section header
        doc.setFontSize(18);
        doc.setTextColor(GOLD);
        doc.text(`${section.icon}  ${section.title}`, 20, currentY);
        currentY += 4;
        drawDiamondDivider(currentY);
        currentY += 10;

        const subtotal = getCategoryTotal(section.items);
        doc.setFontSize(9);
        doc.setTextColor(GRAY);
        doc.text(`${section.items.length} ${section.items.length === 1 ? "item" : "itens"} · Subtotal: ${formatCurrency(subtotal)}`, 20, currentY);
        currentY += 10;

        for (const ti of section.items) {
          checkSpace(35);

          // Item box
          doc.setFillColor("#111111");
          doc.roundedRect(18, currentY - 2, W - 36, 28, 2, 2, "F");
          doc.setDrawColor("#222222");
          doc.roundedRect(18, currentY - 2, W - 36, 28, 2, 2, "S");

          doc.setFontSize(12);
          doc.setTextColor(WHITE);
          doc.text(ti.item.name, 24, currentY + 7);

          if (ti.selectedClass) {
            doc.setFontSize(8);
            doc.setTextColor(GOLD);
            doc.text(`[${ti.selectedClass}]`, 24 + doc.getTextWidth(ti.item.name) + 4, currentY + 7);
          }

          const displayLoc = ti.item.kind === "restaurant" && ti.item.description
            ? ti.item.description.split("|")[0]?.trim()
            : ti.item.location || "";

          if (displayLoc && displayLoc.length < 60 && !displayLoc.includes("%")) {
            doc.setFontSize(8);
            doc.setTextColor(GRAY);
            doc.text(`📍 ${displayLoc}`, 24, currentY + 15);
          }

          // Price
          const priceText = ti.item.price.replace(/\/noite/gi, "").trim();
          doc.setFontSize(12);
          doc.setTextColor(GOLD);
          doc.text(priceText, W - 22, currentY + 7, { align: "right" });

          if (ti.item.kind === "hotel") {
            doc.setFontSize(7);
            doc.setTextColor(GRAY);
            doc.text("/noite", W - 22, currentY + 13, { align: "right" });
          }

          // Maps link
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ti.item.name)}`;
          doc.setFontSize(7);
          doc.setTextColor(GOLD);
          doc.text("Abrir no Maps →", 24, currentY + 22);
          doc.link(24, currentY + 18, 40, 6, { url: mapsUrl });

          currentY += 34;
        }
      }

      // ─── BUDGET SUMMARY PAGE ───
      newContentPage();
      doc.setFontSize(18);
      doc.setTextColor(GOLD);
      doc.text("📊  RESUMO DO ORÇAMENTO", 20, currentY);
      currentY += 4;
      drawDiamondDivider(currentY);
      currentY += 14;

      const budgetRows = [
        { label: "Voos", total: getCategoryTotal(flights), count: flights.length },
        { label: "Hotéis", total: getCategoryTotal(hotels), count: hotels.length },
        { label: "Restaurantes", total: getCategoryTotal(restaurants), count: restaurants.length },
        { label: "Atrações", total: getCategoryTotal(attractions), count: attractions.length },
      ].filter(r => r.count > 0);

      for (const row of budgetRows) {
        doc.setFillColor("#111111");
        doc.roundedRect(18, currentY - 2, W - 36, 14, 2, 2, "F");

        doc.setFontSize(11);
        doc.setTextColor(WHITE);
        doc.text(`${row.label} (${row.count})`, 24, currentY + 7);

        doc.setTextColor(GOLD);
        doc.text(formatCurrency(row.total), W - 22, currentY + 7, { align: "right" });

        currentY += 18;
      }

      // Total
      currentY += 5;
      doc.setDrawColor(GOLD);
      doc.setLineWidth(0.5);
      doc.line(18, currentY, W - 18, currentY);
      currentY += 10;

      doc.setFontSize(16);
      doc.setTextColor(WHITE);
      doc.text("TOTAL ESTIMADO", 24, currentY);
      doc.setTextColor(GOLD);
      doc.setFontSize(20);
      doc.text(formatCurrency(totalBudget), W - 22, currentY, { align: "right" });

      // Footer
      currentY += 30;
      doc.setFontSize(8);
      doc.setTextColor(GRAY);
      doc.text("Gerado pelo Voya — voya-plan-it.lovable.app", W / 2, currentY, { align: "center" });

      doc.save("roteiro-voya.pdf");
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
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

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">
        <Section title="Voos" icon={<Plane className="w-5 h-5" />} items={flights} subtotal={getCategoryTotal(flights)} />
        <Section title="Hotéis" icon={<Hotel className="w-5 h-5" />} items={hotels} subtotal={getCategoryTotal(hotels)} />
        <Section title="Restaurantes" icon={<UtensilsCrossed className="w-5 h-5" />} items={restaurants} subtotal={getCategoryTotal(restaurants)} />
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
                <span className="font-medium text-foreground">{formatCurrency(r.total)}</span>
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
