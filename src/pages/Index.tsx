import { useState, useRef, useEffect } from "react";
import { ArrowRight, Compass, Globe, MapPin } from "lucide-react";
import ChatMessage from "@/components/travel/ChatMessage";
import ChatInput from "@/components/travel/ChatInput";
import FlightCard from "@/components/travel/FlightCard";
import HotelCard from "@/components/travel/HotelCard";
import RestaurantCard from "@/components/travel/RestaurantCard";
import heroImage from "@/assets/hero-travel.jpg";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  cards?: React.ReactNode;
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
  {
    id: "2",
    role: "user",
    content: "Quero ir para Lisboa em setembro, saindo de São Paulo.",
  },
  {
    id: "3",
    role: "assistant",
    content: "Setembro em Lisboa: temperatura média de 25°C, precipitação mínima. Janela ideal. Localizei 3 voos compatíveis. O mais eficiente sai às 22h15 — você dorme no trajeto e chega pronto para o check-in. Analise os cards abaixo.",
  },
];

const Index = () => {
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [showDemo, setShowDemo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    // Demo response
    setTimeout(() => {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Entendido. Deixe-me localizar as melhores opções para essa rota. Uma pergunta: qual é a faixa de orçamento que você tem em mente para a viagem completa (voo + hospedagem)?",
      };
      setMessages((prev) => [...prev, assistantMsg]);
    }, 1200);
  };

  const handleStartDemo = () => {
    setStarted(true);
    setMessages(DEMO_CONVERSATION);
    setShowDemo(true);

    setTimeout(() => {
      const flightMsg: Message = {
        id: "4",
        role: "assistant",
        content: "E aqui estão 2 hotéis que curei para o seu perfil. Ambos em bairros com personalidade, sem armadilha de turista.",
        cards: (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEMO_HOTELS.map((h) => (
              <HotelCard key={h.name} {...h} />
            ))}
          </div>
        ),
      };
      setMessages((prev) => [...prev, flightMsg]);
    }, 2000);
  };

  // Landing view
  if (!started) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Hero */}
        <div className="relative h-screen flex items-center justify-center overflow-hidden">
          <img
            src={heroImage}
            alt="Luxury coastline at golden hour"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />

          <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
            <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl font-bold text-foreground mb-4 tracking-tight">
              Voy<span className="text-primary">a</span>
            </h1>
            <p className="text-lg sm:text-xl text-secondary-foreground mb-2 font-light">
              Seu estrategista de viagens.
            </p>
            <p className="text-sm text-muted-foreground mb-10 max-w-md mx-auto">
              Roteiros com precisão cirúrgica. Preços reais. Logística impecável.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
              <button
                onClick={() => setStarted(true)}
                className="group flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-lg font-medium text-sm hover:bg-primary/90 transition-all"
              >
                Planejar viagem
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={handleStartDemo}
                className="flex items-center gap-2 border border-border text-foreground px-8 py-3.5 rounded-lg font-medium text-sm hover:bg-surface-hover transition-all"
              >
                Ver demonstração
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-background py-24 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Globe, title: "Dados reais", desc: "Preços de voos e hotéis consultados em tempo real. Zero estimativas." },
              { icon: Compass, title: "Logística precisa", desc: "Roteiros otimizados por geolocalização. Sem zigue-zague." },
              { icon: MapPin, title: "Curadoria fina", desc: "Recomendações baseadas no seu perfil, não em rankings genéricos." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Chat view
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between glass sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Voy<span className="text-primary">a</span>
          </h1>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs text-muted-foreground">Estrategista de viagens</span>
        </div>
        <button
          onClick={() => {
            setStarted(false);
            setMessages(INITIAL_MESSAGES);
            setShowDemo(false);
          }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Nova viagem
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} role={msg.role} content={msg.content}>
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

      {/* Input */}
      <div className="border-t border-border px-4 sm:px-6 py-4 glass">
        <div className="max-w-2xl mx-auto">
          <ChatInput
            onSend={handleSend}
            placeholder="Para onde vamos?"
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
