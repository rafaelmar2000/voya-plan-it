import { useState, useRef, useEffect } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import ChatBubble from "@/components/dashboard/ChatBubble";
import DashboardChatInput from "@/components/dashboard/DashboardChatInput";
import DashboardHotelCard from "@/components/dashboard/DashboardHotelCard";
import DashboardFlightCard from "@/components/dashboard/DashboardFlightCard";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  cards?: React.ReactNode;
}

const MOCK_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Bem-vindo de volta ao Voya. Sem rodeios — para onde estamos indo desta vez?",
  },
  {
    id: "2",
    role: "user",
    content: "Quero ir para Lisboa em setembro, saindo de São Paulo. Viagem de 7 dias.",
  },
  {
    id: "3",
    role: "assistant",
    content: "Setembro em Lisboa: 25°C em média, precipitação mínima. Janela perfeita. Localizei 2 voos diretos e 1 com escala. O mais eficiente sai às 22h15 — você dorme no trajeto e chega pronto para o check-in.",
    cards: (
      <div className="space-y-3">
        <DashboardFlightCard
          airline="LATAM"
          departure="GRU"
          arrival="LIS"
          departureTime="22:15"
          arrivalTime="10:30"
          duration="9h 15min"
          price="R$ 3.450"
          stops="Direto"
        />
        <DashboardFlightCard
          airline="TAP Portugal"
          departure="GRU"
          arrival="LIS"
          departureTime="23:50"
          arrivalTime="12:05"
          duration="9h 15min"
          price="R$ 2.980"
          stops="Direto"
        />
      </div>
    ),
  },
  {
    id: "4",
    role: "assistant",
    content: "E aqui estão 2 hotéis que curei para o seu perfil. Ambos em bairros com personalidade — longe de zonas turísticas genéricas.",
    cards: (
      <div className="space-y-3">
        <DashboardHotelCard
          name="Memmo Alfama"
          location="Alfama, Lisboa"
          rating={4.8}
          pricePerNight="R$ 1.250"
          imageUrl="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80"
          amenities={["wifi", "spa", "terraço"]}
        />
        <DashboardHotelCard
          name="The Lumiares"
          location="Bairro Alto, Lisboa"
          rating={4.7}
          pricePerNight="R$ 1.680"
          imageUrl="https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=80"
          amenities={["wifi", "piscina", "bar"]}
        />
      </div>
    ),
  },
];

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeRoteiroId, setActiveRoteiroId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [thinking, setThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setThinking(true);

    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Entendido. Deixe-me cruzar as opções com o seu orçamento. Qual faixa de valor você tem em mente para voo + hospedagem?",
      };
      setMessages((prev) => [...prev, reply]);
      setThinking(false);
    }, 1500);
  };

  const handleNewRoteiro = () => {
    setActiveRoteiroId(null);
    setMessages([
      {
        id: Date.now().toString(),
        role: "assistant",
        content: "Novo roteiro iniciado. Para onde estamos indo?",
      },
    ]);
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <DashboardSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
        activeRoteiroId={activeRoteiroId}
        onSelectRoteiro={setActiveRoteiroId}
        onNewRoteiro={handleNewRoteiro}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground tracking-wide">Voya online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} role={msg.role} content={msg.content}>
                {msg.cards}
              </ChatBubble>
            ))}

            {thinking && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex items-center gap-1.5 px-3 py-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <DashboardChatInput onSend={handleSend} loading={thinking} />
      </div>
    </div>
  );
};

export default Dashboard;
