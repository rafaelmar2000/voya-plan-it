import { useState, useRef, useEffect, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import ChatBubble from "@/components/dashboard/ChatBubble";
import DashboardChatInput from "@/components/dashboard/DashboardChatInput";

const VOYA_API_URL = "https://neat-dove-89.rafaelmar2000.deno.net";

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeRoteiroId, setActiveRoteiroId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [thinking, setThinking] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    }
  }, [activeRoteiroId, loadMessages]);

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

  // ─── Send message ───
  const handleSend = useCallback(
    async (text: string) => {
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
      }

      // Persist user message
      await persistMessage(roteiroId, "user", text);

      // Build payload from current state snapshot (avoid stale closure)
      let currentMessages: Message[] = [];
      setMessages((prev) => { currentMessages = prev; return prev; });
      const apiMessages = currentMessages.map(({ role, content }) => ({ role, content }));

      const payload = JSON.stringify({ messages: apiMessages });

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

        const text = await res.text();
        if (!text || text.trim().length === 0) {
          throw new Error("Corpo vazio na resposta do servidor");
        }

        const data = JSON.parse(text);
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
    [activeRoteiroId, user]
  );

  // ─── New roteiro ───
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

  // ─── Select existing roteiro from sidebar ───
  const handleSelectRoteiro = (id: string) => {
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {loadingHistory ? (
              <div className="flex justify-center py-12">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              </div>
            ) : (
              messages.map((msg) => (
                <ChatBubble key={msg.id} role={msg.role} content={msg.content} hasFunctionCall={msg.hasFunctionCall} />
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
