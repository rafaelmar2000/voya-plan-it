import { useState } from "react";
import { Check, ChefHat } from "lucide-react";

const CUISINES = [
  { id: "italiana", label: "🍝 Italiana" },
  { id: "japonesa", label: "🍣 Japonesa/Sushi" },
  { id: "americana", label: "🍔 Americana/Burgers" },
  { id: "frutos_do_mar", label: "🦞 Frutos do Mar" },
  { id: "vegetariana", label: "🥗 Vegetariana/Vegana" },
  { id: "mexicana", label: "🌮 Mexicana" },
  { id: "francesa", label: "🥐 Francesa" },
  { id: "churrascaria", label: "🥩 Churrascaria" },
  { id: "fast_food", label: "🍟 Fast Food" },
  { id: "cafe_brunch", label: "☕ Café/Brunch" },
];

interface CuisineSelectorProps {
  onConfirm: (selected: string[]) => void;
}

const CuisineSelector = ({ onConfirm }: CuisineSelectorProps) => {
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
    onConfirm(
      selected.length > 0
        ? selected.map((id) => CUISINES.find((c) => c.id === id)!.label)
        : []
    );
  };

  const handleSkip = () => {
    if (confirmed) return;
    setConfirmed(true);
    onConfirm([]);
  };

  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ChefHat className="w-4 h-4 text-primary" />
        <span className="font-medium text-foreground">Selecione os estilos de culinária:</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {CUISINES.map((c) => (
          <button
            key={c.id}
            onClick={() => !confirmed && toggle(c.id)}
            disabled={confirmed}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all text-left ${
              selected.includes(c.id)
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            } ${confirmed ? "opacity-60 cursor-default" : "cursor-pointer"}`}
          >
            {selected.includes(c.id) && (
              <Check className="w-3.5 h-3.5 text-primary shrink-0" />
            )}
            {c.label}
          </button>
        ))}
      </div>

      {!confirmed && (
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {selected.length > 0
              ? `Confirmar (${selected.length} selecionados)`
              : "Confirmar"}
          </button>
          <button
            onClick={handleSkip}
            className="px-4 py-2 rounded-lg border border-border/40 text-muted-foreground text-sm hover:text-foreground transition-colors"
          >
            Pular
          </button>
        </div>
      )}
      {confirmed && (
        <div className="text-xs text-muted-foreground">
          {selected.length > 0
            ? `✓ ${selected.length} estilos selecionados`
            : "✓ Sem preferência"}
        </div>
      )}
    </div>
  );
};

export default CuisineSelector;
