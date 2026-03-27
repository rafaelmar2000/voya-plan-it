import { useState, useEffect } from "react";
import { Plus, MessageSquare, ChevronLeft, LogOut, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Roteiro {
  id: string;
  destino: string | null;
  created_at: string | null;
}

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeRoteiroId: string | null;
  onSelectRoteiro: (id: string) => void;
  onNewRoteiro: () => void;
  onDeleteRoteiro?: (id: string) => void;
}

const DashboardSidebar = ({
  collapsed,
  onToggle,
  activeRoteiroId,
  onSelectRoteiro,
  onNewRoteiro,
  onDeleteRoteiro,
}: DashboardSidebarProps) => {
  const { user, signOut } = useAuth();
  const [roteiros, setRoteiros] = useState<Roteiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRoteiros = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("roteiros")
      .select("id, destino, created_at")
      .order("created_at", { ascending: false });
    setRoteiros(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchRoteiros();
  }, [user]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    // Delete messages first, then the roteiro
    await supabase.from("mensagens_chat").delete().eq("roteiro_id", deleteTarget);
    await supabase.from("roteiros").delete().eq("id", deleteTarget);
    setRoteiros((prev) => prev.filter((r) => r.id !== deleteTarget));
    onDeleteRoteiro?.(deleteTarget);
    setDeleteTarget(null);
    setDeleting(false);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <>
      <aside
        className={`h-screen flex flex-col border-r border-border bg-card transition-all duration-300 shrink-0 ${
          collapsed ? "w-16" : "w-72"
        }`}
      >
        {/* Top */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          {!collapsed && (
            <span className="font-display text-xl tracking-[0.15em] text-foreground">VOYA</span>
          )}
          <button
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* New button */}
        <div className="px-3 py-3">
          <button
            onClick={onNewRoteiro}
            className={`flex items-center gap-2 bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all duration-200 ${
              collapsed ? "w-10 h-10 justify-center" : "w-full px-4 py-2.5 justify-center"
            }`}
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Novo Roteiro</span>}
          </button>
        </div>

        {/* Trip list */}
        <div className="flex-1 overflow-y-auto px-2 py-1">
          {!collapsed && (
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 mb-2">
              Histórico
            </p>
          )}

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : roteiros.length === 0 ? (
            !collapsed && (
              <p className="text-xs text-muted-foreground px-2 py-4">
                Nenhum roteiro ainda.
              </p>
            )
          ) : (
            roteiros.map((r) => (
              <div
                key={r.id}
                className={`group flex items-center gap-0.5 mb-0.5 transition-all duration-200 ${
                  activeRoteiroId === r.id
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                }`}
              >
                <button
                  onClick={() => onSelectRoteiro(r.id)}
                  className="flex-1 flex items-center gap-2.5 px-2.5 py-2.5 text-left min-w-0"
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{r.destino || "Sem destino"}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(r.created_at)}</p>
                    </div>
                  )}
                </button>
                {!collapsed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(r.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 mr-1 text-muted-foreground hover:text-destructive transition-all duration-200"
                    title="Excluir roteiro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* User / Logout */}
        <div className="border-t border-border px-3 py-3">
          <button
            onClick={signOut}
            className={`flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm ${
              collapsed ? "justify-center w-full" : ""
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Excluir roteiro?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as mensagens desta conversa serão apagadas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DashboardSidebar;
