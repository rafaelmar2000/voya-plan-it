import { useState, useRef, useEffect } from "react";
import { ArrowRight, Compass, Globe, MapPin } from "lucide-react";
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

const DEMO_FLIGHTS = [
  { airline: "LATAM", departure: "GRU", arrival: "LIS", departureTime: "22:15", arrivalTime: "10:30", duration: "9h 15min", price: "R$ 3.450", stops: "Direto" },
  { airline: "TAP Portugal", departure: "GRU", arrival: "LIS", departureTime: "23:50", arrivalTime: "12:05", duration: "9h 15min", price: "R$ 2.980", stops: "Direto" },
  { airline: "Air France", departure: "GRU", arrival: "LIS", departureTime: "17:40", arrivalTime: "09:10", duration: "11h 30min", price: "R$ 2.640", stops: "1 parada (CDG)" },
];

const DEMO_HOTELS = [
  { name: "Memmo Alfama", location: "Alfama, Lisboa", rating: 4.8, pricePerNight: "R$ 1.250", imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80", amenities: ["wifi", "spa", "terraço"] },
  { name: "The Lumiares", location: "Bairro Alto, Lisboa", rating: 4.7, pricePerNight: "R$ 1.680", imageUrl: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=80", amenities: ["wifi", "piscina", "bar"] },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Bem-vindo ao Voya. Sou seu estrategista de viagens. Sem rodeios, sem clichês — apenas logística precisa e curadoria inteligente. Para onde estamos indo?",
  },
];

const DEMO_CONVERSATION: Message[] = [
  ...INITIAL_MESSAGES,
  { id: "2", role: "user", content: "Quero ir para Lisboa em setembro, saindo de São Paulo." },
  { id: "3", role: "assistant", content: "Setembro em Lisboa: temperatura média de 25°C, precipitação mínima. Janela ideal. Localizei 3 voos compatíveis. O mais eficiente sai às 22h15 — você dorme no trajeto e chega pronto para o check-in. Analise os cards abaixo." },
];

const Index = () => {
  const [started, setStarted] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [showDemo, setShowDemo] = useState(false);
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

      setMessages((prev) =>
        prev.map((m) =>
          m.id === typingId
            ? { ...m, content: data.content, isTyping: false }
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

        {/* Features */}
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
          onClick={() => { setStarted(false); setMessages(INITIAL_MESSAGES); setShowDemo(false); }}
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
              {msg.id === "3" && showDemo && (
                <div className="space-y-3">
                  {DEMO_FLIGHTS.map((f) => (
                    <FlightCard key={f.airline + f.departureTime} {...f} />
                  ))}
                </div>
              )}
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
