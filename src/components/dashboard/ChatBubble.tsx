import { Loader2, Compass, UtensilsCrossed } from "lucide-react";
import { parseHotelsFromText } from "@/lib/parseHotels";
import type { ParsedHotel } from "@/lib/parseHotels";
import HotelSuggestionCard from "@/components/dashboard/HotelSuggestionCard";
import FlightTicketCard from "@/components/dashboard/FlightTicketCard";
import CuisineSelector from "@/components/dashboard/CuisineSelector";
import AttractionSelector from "@/components/dashboard/AttractionSelector";
import React, { useState } from "react";

function renderMarkdownBold(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const bold = part.match(/^\*\*(.+)\*\*$/);
    if (bold) return <strong key={i} className="font-semibold">{bold[1]}</strong>;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function extractCategory(hotel: ParsedHotel): string {
  // 1. Tenta CATEGORIA: no detailsText (campo explícito)
  const catMatch = hotel.detailsText.match(/CATEGORIA:\s*([^\n\r]+)/);
  if (catMatch) {
    const cat = catMatch[1].trim();
    if (cat && cat !== "Restaurante" && cat !== "Atração" && cat !== "Hotel" && cat !== "Voo") {
      return cat;
    }
  }
  // 2. Tenta extrair do RESUMO — último segmento após "|"
  const resumeParts = hotel.description.split("|");
  if (resumeParts.length >= 3) {
    const last = resumeParts[resumeParts.length - 1].trim();
    if (last.length > 2) return last;
  }
  // 3. Tenta TIPO:
  const tipoMatch = hotel.detailsText.match(/TIPO:\s*([^\n\r]+)/);
  if (tipoMatch) return tipoMatch[1].trim();
  return "Geral";
}

function groupByCategory(items: ParsedHotel[]): Record<string, ParsedHotel[]> {
  const groups: Record<string, ParsedHotel[]> = {};
  for (const item of items) {
    const cat = extractCategory(item);
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }
  return groups;
}

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  hasFunctionCall?: boolean;
  children?: React.ReactNode;
  onSend?: (message: string) => void;
}

const ChatBubble = ({ role, content, hasFunctionCall, children, onSend }: ChatBubbleProps) => {
  const isUser = role === "user";
  const [showAttractionSelector, setShowAttractionSelector] = useState(false);
  const [attractionConfirmed, setAttractionConfirmed] = useState(false);

  const hasCuisineSelector = !isUser && content.includes("[SELECAO_CULINARIA]");
  const hasAttractionButton = !isUser && content.includes("[BOTAO_ATRACOES]");
  const cleanContent = content
    .replace("[SELECAO_CULINARIA]", "")
    .replace("[BOTAO_ATRACOES]", "")
    .trim();

  const { introText, hotels } = !isUser
    ? parseHotelsFromText(cleanContent)
    : { introText: cleanContent, hotels: [] };

  console.log("PARSED:", hotels.map(h => ({name: h.name, kind: h.kind})));

  const flights = hotels.filter((h) => h.kind === "flight");
  const hotelItems = hotels.filter((h) => h.kind === "hotel" || h.kind === "generic");
  const attractionItems = hotels.filter((h) => h.kind === "attraction");

  hotels.filter(h => h.kind === "attraction").forEach(h => {
    console.log("ATTRACTION detailsText:", h.name, "|||", h.detailsText.slice(0, 200));
    console.log("ATTRACTION description:", h.description);
  });

  const attractionGroups = groupByCategory(attractionItems);

  const handleCuisineConfirm = (selected: string[]) => {
    if (!onSend) return;
    if (selected.length > 0) {
      onSend(`Prefiro os seguintes estilos de culinária: ${selected.join(", ")}`);
    } else {
      onSend("Sem preferência de culinária, pode sugerir qualquer tipo.");
    }
  };

  const handleAttractionConfirm = (selected: string[]) => {
    if (!onSend) return;
    setAttractionConfirmed(true);
    if (selected.length > 0) {
      onSend(`ATRAÇÕES SELECIONADAS: Quero ver atrações nas seguintes categorias: ${selected.join(", ")}. Por favor busque atrações turísticas nessas categorias.`);
    } else {
      onSend("ATRAÇÕES SELECIONADAS: Sem preferência de categoria, mostre as atrações mais populares.");
    }
  };

  const cidadeMatch = cleanContent.match(/em\s+([A-Za-zÀ-ú\s]+?)[\.,!]/i);
  const cidade = cidadeMatch?.[1]?.trim() || "destino";

  const isRestaurantCategory = (cat: string) =>
    /Restaurante|Culinária|Fast|Café|Italiana|Japonesa|Americana|Francesa|Mexicana|Churrasco|Frutos/i.test(cat);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
      <div className={`${isUser ? "max-w-[85%] sm:max-w-[70%]" : "max-w-[95%] sm:max-w-[90%]"} ${isUser ? "" : "space-y-4"}`}>
        {introText && (
          <div
            className={
              isUser
                ? "bg-charcoal text-foreground px-4 py-3 rounded-lg rounded-br-sm text-sm leading-relaxed"
                : "text-foreground/90 text-sm leading-[1.8] whitespace-pre-line [&>*]:mb-2"
            }
          >
            {renderMarkdownBold(introText.replace(/\[\/?[A-Z_]+\]/g, "").trim())}
          </div>
        )}

        {hasCuisineSelector && (
          <CuisineSelector onConfirm={handleCuisineConfirm} />
        )}

        {hasFunctionCall && (
          <div className="mt-3 flex items-center gap-3 bg-[hsl(var(--charcoal))] border border-foreground/10 px-4 py-3 rounded text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Buscando dados em tempo real...</span>
          </div>
        )}

        {/* Voos */}
        {flights.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3">
            {flights.map((f, i) => (
              <FlightTicketCard key={`flight-${f.name}-${i}`} flight={f} index={i} />
            ))}
          </div>
        )}

        {/* Hotéis */}
        {hotelItems.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hotelItems.map((hotel, i) => (
              <HotelSuggestionCard key={`${hotel.name}-${i}`} hotel={hotel} index={i} />
            ))}
          </div>
        )}

        {/* Atrações e Restaurantes agrupados por categoria */}
        {Object.keys(attractionGroups).length > 0 && (
          <div className="mt-4 space-y-5">
            {Object.entries(attractionGroups).map(([categoria, items]) => (
              <div key={categoria}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-border/30" />
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {isRestaurantCategory(categoria)
                      ? <UtensilsCrossed className="w-3.5 h-3.5" />
                      : <Compass className="w-3.5 h-3.5" />
                    }
                    {categoria}
                  </span>
                  <div className="h-px flex-1 bg-border/30" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {items.map((item, i) => (
                    <HotelSuggestionCard key={`${item.name}-${i}`} hotel={item} index={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botão Ver Atrações */}
        {hasAttractionButton && !showAttractionSelector && !attractionConfirmed && (
          <button
            onClick={() => setShowAttractionSelector(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-lg border border-primary/40 bg-primary/5 text-primary text-sm font-medium hover:bg-primary/15 transition-all w-full mt-2"
          >
            <Compass className="w-4 h-4" />
            Explorar Atrações em {cidade} →
          </button>
        )}

        {showAttractionSelector && !attractionConfirmed && (
          <AttractionSelector onConfirm={handleAttractionConfirm} />
        )}

        {attractionConfirmed && (
          <div className="text-xs text-muted-foreground mt-2">✓ Preferências de atrações registradas</div>
        )}

        {children && <div className="mt-3 space-y-3">{children}</div>}
      </div>
    </div>
  );
};

export default ChatBubble;
