import { Loader2, Compass } from "lucide-react";
import { parseHotelsFromText } from "@/lib/parseHotels";
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

  console.log("PARSED hotels:", hotels.length, hotels.map(h => ({name: h.name, kind: h.kind})));

  const flights = hotels.filter((h) => h.kind === "flight");
  const nonFlights = hotels.filter((h) => h.kind !== "flight");

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

        {flights.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3">
            {flights.map((f, i) => (
              <FlightTicketCard key={`flight-${f.name}-${i}`} flight={f} index={i} />
            ))}
          </div>
        )}

        {nonFlights.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nonFlights.map((hotel, i) => (
              <HotelSuggestionCard key={`${hotel.name}-${i}`} hotel={hotel} index={i} />
            ))}
          </div>
        )}

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
