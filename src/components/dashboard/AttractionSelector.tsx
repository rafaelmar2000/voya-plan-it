import { useState } from "react";
import { Check, Compass } from "lucide-react";

const ATTRACTIONS = [
  { id: "museus", label: "🎨 Museus e Arte" },
  { id: "parques", label: "🌿 Parques e Natureza" },
  { id: "compras", label: "🛍️ Compras e Shopping" },
  { id: "noturna", label: "🍸 Vida Noturna e Bares" },
  { id: "historia", label: "🏛️ História e Arquitetura" },
  { id: "aventura", label: "🧗 Esportes e Aventura" },
  { id: "shows", label: "🎭 Shows e Teatro" },
  { id: "praias", label: "🏖️ Praias" },
  { id: "gastronomia", label: "🥘 Gastronomia e Mercados" },
  { id: "tecnologia", label: "🔬 Tecnologia e Ciência" },
];

interface AttractionSelectorProps {
  onConfirm: (selected: string[]) => void;
}

const AttractionSelector = ({ onConfirm }: AttractionSelectorProps) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    if (confirmed) return;
    setConfirmed(true);
    const labels = selected.length > 0
      ? ATTRACTIONS.filter((a) => selected.includes(a.id)).map((a) => a.label)
      : [];
    onConfirm(labels);
  };

  const handleSkip = () => {
    if (confirmed) return;
    setConfirmed(true);
    onConfirm([]);
  };

  return (
    <div className="mt-3 p-4 rounded-xl border border-border/40 bg-muted/20 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Compass className="w-4 h-4 text-primary" />
        <span>Selecione seus interesses:</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {ATTRACTIONS.map((a) => (
          <button
            key={a.id}
            onClick={() => !confirmed && toggle(a.id)}
            disabled={confirmed}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all text-left ${
              selected.includes(a.id)
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            } ${confirmed ? "opacity-60 cursor-default" : "cursor-pointer"}`}
          >
            {selected.includes(a.id) && (
              <Check className="w-3.5 h-3.5 text-primary shrink-0" />
            )}
            {a.label}
          </button>
        ))}
      </div>

      {!confirmed && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {selected.length > 0 ? `Buscar Atrações (${selected.length} categorias)` : "Confirmar"}
          </button>
          <button
            onClick={handleSkip}
            className="px-4 py-2.5 rounded-lg border border-border/40 text-muted-foreground text-sm hover:text-foreground hover:border-border transition-colors"
          >
            Pular
          </button>
        </div>
      )}
      {confirmed && (
        <div className="text-xs text-muted-foreground text-center pt-1">
          {selected.length > 0 ? `✓ ${selected.length} categorias selecionadas` : "✓ Sem preferência"}
        </div>
      )}
    </div>
  );
};

export default AttractionSelector;
