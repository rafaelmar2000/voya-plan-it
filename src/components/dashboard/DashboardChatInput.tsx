import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

interface DashboardChatInputProps {
  onSend: (message: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

const DashboardChatInput = ({ onSend, loading, disabled }: DashboardChatInputProps) => {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || loading || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <div className="border-t border-border px-4 sm:px-6 py-4 glass">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Para onde vamos?"
          disabled={loading || disabled}
          className="w-full bg-foreground/5 border border-foreground/10 backdrop-blur-md pl-5 pr-14 py-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all duration-300"
        />
        <button
          type="submit"
          disabled={!value.trim() || loading || disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-primary text-primary-foreground disabled:opacity-30 hover:bg-primary/85 transition-all duration-200"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
};

export default DashboardChatInput;
