import { useState, useRef, useEffect, useCallback } from "react";
import { Trash2, Plus } from "lucide-react";
import { useMyTrip } from "@/contexts/MyTripContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import ChatBubble from "@/components/dashboard/ChatBubble";
import DashboardChatInput from "@/components/dashboard/DashboardChatInput";
import BudgetSummary from "@/components/dashboard/BudgetSummary";


const VOYA_API_URL = "https://wide-lobster-46.rafaelmar200050.deno.net";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  hasFunctionCall?: boolean;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Bem-vindo ao Voya. Sem rodeios — para onde estamos indo desta vez?",
};

const Dashboard = () => {
  const { user } = useAuth();
  const { clearTrip, setOnItemAdded, loadTripForRoteiro, saveTripForRoteiro } = useMyTrip();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeRoteiroId, setActiveRoteiroId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [thinking, setThinking] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>(messages);

  // Keep ref in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  // ─── Load messages when a roteiro is selected ───
  const loadMessages = useCallback(async (roteiroId: string) => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from("mensagens_chat")
      .select("id, papel, conteudo, created_at")
      .eq("roteiro_id", roteiroId)
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Erro ao carregar mensagens:", error);
      setMessages([WELCOME_MESSAGE]);
    } else if (data && data.length > 0) {
      setMessages(
        data.map((m) => ({
          id: m.id,
          role: (m.papel as "user" | "assistant") ?? "assistant",
          content: m.conteudo ?? "",
        }))
      );
    } else {
      setMessages([WELCOME_MESSAGE]);
    }
    setLoadingHistory(false);
  }, []);

  useEffect(() => {
    if (activeRoteiroId) {
      loadMessages(activeRoteiroId);
      loadTripForRoteiro(activeRoteiroId);
    }
  }, [activeRoteiroId, loadMessages, loadTripForRoteiro]);

  // ─── Persist a single message ───
  const persistMessage = async (roteiroId: string, role: string, content: string) => {
    const { error } = await supabase.from("mensagens_chat").insert({
      roteiro_id: roteiroId,
      papel: role,
      conteudo: content,
    });
    if (error) console.error("Erro ao salvar mensagem:", error);
  };

  // ─── Create a new roteiro and return its id ───
  const createRoteiro = async (firstMessage: string): Promise<string | null> => {
    if (!user) return null;
    // Use the first ~40 chars as destination hint
    const destino = firstMessage.slice(0, 60);
    const { data, error } = await supabase
      .from("roteiros")
      .insert({ user_id: user.id, destino })
      .select("id")
      .single();

    if (error) {
      console.error("Erro ao criar roteiro:", error);
      return null;
    }
    return data.id;
  };

  // ─── Detect new-destination intent ───
  const isNewDestinationIntent = (text: string): boolean => {
    const patterns = [
      /\b(?:quero|vamos|bora|partiu|vou)\s+(?:ir\s+)?(?:para|pra|a)\b/i,
      /\b(?:nova\s+viagem|novo\s+destino|outro\s+destino|mudar\s+destino)\b/i,
      /\b(?:planej(?:ar|e|a)\s+(?:uma\s+)?viagem)\b/i,
      /\b(?:me\s+lev[ae])\s+(?:para|pra)\b/i,
    ];
    // Only trigger if we already have real conversation (beyond welcome)
    const hasHistory = messagesRef.current.length > 2;
    return hasHistory && patterns.some((p) => p.test(text));
  };

  // ─── Send message ───
  const handleSend = useCallback(
    async (text: string) => {
      // Amnesia: if user starts a new destination, reset everything
      if (isNewDestinationIntent(text)) {
        clearTrip();
        setActiveRoteiroId(null);
        setMessages([]);
        // Small delay so state clears before we proceed
        await new Promise((r) => setTimeout(r, 50));
      }

      const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setThinking(true);

      let roteiroId = activeRoteiroId;

      // If no active roteiro, create one
      if (!roteiroId) {
        roteiroId = await createRoteiro(text);
        if (!roteiroId) {
          setMessages((prev) => [
            ...prev,
            { id: (Date.now() + 1).toString(), role: "assistant", content: "Erro ao criar roteiro. Faça login novamente." },
          ]);
          setThinking(false);
          return;
        }
        setActiveRoteiroId(roteiroId);
        saveTripForRoteiro(roteiroId);
      }

      // Persist user message
      await persistMessage(roteiroId, "user", text);

      // Build payload from ref + the new user message to guarantee it's included
      const currentMsgs = messagesRef.current.map(({ role, content }) => ({ role, content }));
      // Ensure the user message we just added is present (ref may lag one render)
      const lastMsg = currentMsgs[currentMsgs.length - 1];
      if (!lastMsg || lastMsg.content !== text || lastMsg.role !== "user") {
        currentMsgs.push({ role: "user", content: text });
      }

      // Debug: log payload before sending
      console.log("[Voya] Sending payload:", JSON.stringify({ messages: currentMsgs }));

      const payload = JSON.stringify({ messages: currentMsgs });

      try {
        const res = await fetch(VOYA_API_URL, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: payload,
        });

        if (!res.ok) {
          const errorText = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        const responseText = await res.text();
        if (!responseText || responseText.trim().length === 0) {
          throw new Error("Corpo vazio na resposta do servidor");
        }

        const data = JSON.parse(responseText);
        const replyContent = data.content || "Sem resposta.";

        const reply: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: replyContent,
          hasFunctionCall: !!data.function_call,
        };

        setMessages((prev) => [...prev, reply]);

        // Persist assistant message
        await persistMessage(roteiroId, "assistant", replyContent);
      } catch (error) {
        const resolvedError = error instanceof Error ? error : new Error("Erro desconhecido");
        console.error(resolvedError);
        console.table({ url: VOYA_API_URL, error: resolvedError.name });

        const errContent = `ERRO DE CONEXÃO: ${resolvedError.message}. Verifique se o domínio deno.net está bloqueado no seu firewall.`;
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 2).toString(), role: "assistant", content: errContent },
        ]);
      } finally {
        setThinking(false);
      }
    },
    [activeRoteiroId, user, clearTrip]
  );

  useEffect(() => {
    const iataToCity: Record<string, string> = {
      JFK: "Nova York", GRU: "São Paulo", GIG: "Rio de Janeiro",
      LHR: "Londres", CDG: "Paris", MIA: "Miami", LIS: "Lisboa",
      MCO: "Orlando", CUN: "Cancún", EZE: "Buenos Aires",
      SCL: "Santiago", LAX: "Los Angeles", NRT: "Tokyo", DXB: "Dubai"
    };

    setOnItemAdded((tripItem) => {
      if (tripItem.item.kind === "flight") {
        const descricao = tripItem.item.description || "";
        const destinoMatch = descricao.match(/[A-Z]{3}\s*[✈️➡→\->]+\s*([A-Z]{3})/);
        const iata = destinoMatch?.[1] || "";
        const cidade = iataToCity[iata] || iata;
        const mensagem = cidade
          ? `Adicionei o voo ${tripItem.item.name} (${tripItem.selectedClass || "Econômica"}) ao meu roteiro. Agora quero ver hotéis em ${cidade}.`
          : `Adicionei o voo ao meu roteiro. Agora quero ver opções de hospedagem.`;
        handleSend(mensagem);
      } else if (tripItem.item.kind === "hotel") {
        const descricao = tripItem.item.description || "";
        const location = tripItem.item.location || "";
        const cidade = location.split(",").pop()?.trim() ||
                       descricao.match(/em\s+([A-Za-zÀ-ú\s]+)/i)?.[1]?.trim() ||
                       "destino";
        handleSend(`Adicionei o hotel ${tripItem.item.name} ao meu roteiro. Agora quero ver opções de restaurantes em ${cidade}.`);
      }
    });
    return () => setOnItemAdded(null);
  }, [handleSend, setOnItemAdded]);

  // ─── New roteiro ───
  const handleNewRoteiro = () => {
    loadTripForRoteiro(null);
    setActiveRoteiroId(null);
    setMessages([{
      id: Date.now().toString(),
      role: "assistant",
      content: "Novo roteiro iniciado. Para onde estamos indo?",
    }]);
  };

  // ─── Select existing roteiro from sidebar ───
  const handleSelectRoteiro = (id: string) => {
    loadTripForRoteiro(id);
    setActiveRoteiroId(id);
  };

  const handleDeleteRoteiro = (id: string) => {
    if (activeRoteiroId === id) {
      handleNewRoteiro();
    }
  };

  const handleClearCurrentChat = async () => {
    if (!activeRoteiroId) return;
    await supabase.from("mensagens_chat").delete().eq("roteiro_id", activeRoteiroId);
    await supabase.from("roteiros").delete().eq("id", activeRoteiroId);
    handleNewRoteiro();
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <DashboardSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
        activeRoteiroId={activeRoteiroId}
        onSelectRoteiro={handleSelectRoteiro}
        onNewRoteiro={handleNewRoteiro}
        onDeleteRoteiro={handleDeleteRoteiro}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground tracking-wide">Voya online</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleNewRoteiro}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              title="Novo Roteiro"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Novo Roteiro</span>
            </button>
            {activeRoteiroId && (
              <button
                onClick={handleClearCurrentChat}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                title="Limpar roteiro atual"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpar Roteiro</span>
              </button>
            )}
          </div>
        </div>

        <BudgetSummary />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {loadingHistory ? (
              <div className="flex justify-center py-12">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              </div>
            ) : (
              messages.map((msg) => (
                <ChatBubble key={msg.id} role={msg.role} content={msg.content} hasFunctionCall={msg.hasFunctionCall} onSend={handleSend} />
              ))
            )}

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

        <DashboardChatInput onSend={handleSend} loading={thinking} />
      </div>
    </div>
  );
};

export default Dashboard;
