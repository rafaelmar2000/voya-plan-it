import { useState, useRef, useEffect, useCallback } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import ChatBubble from "@/components/dashboard/ChatBubble";
import DashboardChatInput from "@/components/dashboard/DashboardChatInput";
import { toast } from "@/hooks/use-toast";

const VOYA_API_URL = "https://neat-dove-89.deno.dev";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  hasFunctionCall?: boolean;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Bem-vindo ao Voya. Sem rodeios — para onde estamos indo desta vez?",
  },
];

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeRoteiroId, setActiveRoteiroId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [thinking, setThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const handleSend = useCallback(async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setThinking(true);

    const apiMessages = updatedMessages.map(({ role, content }) => ({ role, content }));

    try {
      const res = await fetch(VOYA_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      const reply: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content || "Sem resposta.",
        hasFunctionCall: !!data.function_call,
      };

      setMessages((prev) => [...prev, reply]);
    } catch {
      toast({
        title: "Conexão perdida",
        description: "Não foi possível conectar ao Voya. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setThinking(false);
    }
  }, [messages]);

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
            <div className="w-2 h-2 rounded-full bg-primary" />
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
