import { Compass } from "lucide-react";

interface AttractionButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const AttractionButton = ({ onClick, disabled }: AttractionButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-4 py-3 rounded-lg border border-primary/40 bg-primary/5 text-primary text-sm font-medium hover:bg-primary/15 transition-all w-full mt-2"
    >
      <Compass className="w-4 h-4" />
      Ver Atrações em {disabled ? "..." : "destino"} →
    </button>
  );
};

export default AttractionButton;
