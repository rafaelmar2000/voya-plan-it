import { useState, useRef, useEffect } from "react";
import { Compass, Globe, MapPin } from "lucide-react";
import ChatMessage from "@/components/travel/ChatMessage";
import ChatInput from "@/components/travel/ChatInput";
import FlightCard from "@/components/travel/FlightCard";
import HotelCard from "@/components/travel/HotelCard";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import AuthModal from "@/components/landing/AuthModal";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  cards?: React.ReactNode;
  isTyping?: boolean;
}

interface ParsedFlight {
  airline: string;
  price: string;
  resumo: string;
  detalhes: string;
  logoUrl?: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: string;
}

// ─── PARSER RESILIENTE ────────────────────────────────────────────────────────
function parseFlightCards(text: string): { cards: ParsedFlight[]; cleanText: string } {
  const cards: ParsedFlight[] = [];
  const cardRegex = /\[CATEGORIA\]:.*?Voo[\s\S]*?\[FIM\]/gi;
  const matches = text.match(cardRegex) || [];

  for (const block of matches) {
    const get = (tag: string) => {
      const m = block.match(new RegExp(`\\[${tag}\\]:\\s*([^\\[\\n]+)`));
      return m ? m[1].trim() : "";
    };

    const detailsBlock = block.match(/\[DETALHES\]:([\s\S]*?)\[FIM\]/);
    const detailsText = detailsBlock ? detailsBlock[1] : "";

    const getDetail = (key: string) => {
      const m = detailsText.match(new RegExp(`${key}:\\s*([^\\n]+)`));
      return m ? m[1].trim() : "";
    };

    const resumo = get("RESUMO");
    const timeMatch = resumo.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
    const iataMatch = resumo.match(/([A-Z]{3})\s*✈️?\s*([A-Z]{3})/);
    const stopsMatch = resumo.match(/\|\s*([^|]+)$/);
    const flightMatch = resumo.match(/Voo\s+([A-Z0-9]+)/i);
    const durationMatch = detailsText.match(/(\d+h\s*\d*m?i?n?)/i);

    cards.push({
      airline: get("NOME"),
      price: get("PRECO"),
      resumo,
      detalhes: detailsText,
      logoUrl: get("FOTO") || undefined,
      departure: iataMatch ? iataMatch[1] : "",
      arrival: iataMatch ? iataMatch[2] : "",
      departureTime: timeMatch ? timeMatch[1] : "",
      arrivalTime: timeMatch ? timeMatch[2] : "",
      duration: durationMatch ? durationMatch[1] : "",
      stops: stopsMatch ? stopsMatch[1].trim() : "Ver detalhes",
    });
  }

  const cleanText = text.replace(cardRegex, "").replace(/\n{3,}/g, "\n\n").trim();

  return { cards, cleanText };
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Bem-vindo ao Voya. Sou seu estrategista de viagens. Sem rodeios, sem clichês — apenas logística precisa e curadoria inteligente. Para onde estamos indo?",
  },
];

const Index = () => {
  const [started, setStarted] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string) => {
    setStarted(true);
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    const typingId = (Date.now() + 1).toString();
    const typingMsg: Message = { id: typingId, role: "assistant", content: "", isTyping: true };

    setMessages((prev) => [...prev, userMsg, typingMsg]);

    try {
      const allMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("https://neat-dove-89.rafaelmar2000.deno.net", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages }),
      });

      const data = await response.json();
      const rawContent: string = data.content || "";

      const { cards, cleanText } = parseFlightCards(rawContent);

      const cardNodes = cards.length > 0 ? (
        <div className="space-y-3 mt-3">
          {cards.map((f, i) => (
            <FlightCard
              key={`${f.airline}-${i}`}
              airline={f.airline}
              departure={f.departure}
              arrival={f.arrival}
              departureTime={f.departureTime}
              arrivalTime={f.arrivalTime}
              duration={f.duration}
              price={f.price}
              stops={f.stops}
              logoUrl={f.logoUrl}
            />
          ))}
        </div>
      ) : undefined;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === typingId
            ? { ...m, content: cleanText, cards: cardNodes, isTyping: false }
            : m
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === typingId
            ? { ...m, content: "Ops! Problema de conexão. Tente novamente.", isTyping: false }
            : m
        )
      );
    }
  };

  // Landing view
  if (!started) {
    return (
      <>
        <Header onOpenAuth={() => setAuthOpen(true)} />
        <HeroSection onSend={handleSend} />

        <div className="bg-background py-24 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: Globe, title: "Dados reais", desc: "Preços de voos e hotéis consultados em tempo real. Zero estimativas." },
              { icon: Compass, title: "Logística precisa", desc: "Roteiros otimizados por geolocalização. Sem zigue-zague." },
              { icon: MapPin, title: "Curadoria fina", desc: "Recomendações baseadas no seu perfil, não em rankings genéricos." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="w-12 h-12 flex items-center justify-center mx-auto mb-4 border border-primary/20 bg-primary/5">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-xl tracking-wide text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </>
    );
  }

  // Chat view
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between glass sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="font-display text-2xl tracking-[0.15em] text-foreground">VOYA</span>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs text-muted-foreground tracking-wide">Estrategista de viagens</span>
        </div>
        <button
          onClick={() => { setStarted(false); setMessages(INITIAL_MESSAGES); }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Nova viagem
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} role={msg.role} content={msg.content} isTyping={msg.isTyping}>
              {msg.cards}
            </ChatMessage>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-border px-4 sm:px-6 py-4 glass">
        <div className="max-w-2xl mx-auto">
          <ChatInput onSend={handleSend} placeholder="Para onde vamos?" />
        </div>
      </div>
    </div>
  );
};

export default Index;
