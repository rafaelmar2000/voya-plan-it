import { useState, useRef, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";

interface ChatHeroInputProps {
  onSend: (message: string) => void;
}

const ChatHeroInput = ({ onSend }: ChatHeroInputProps) => {
  const [value, setValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", delay: 1.4 }
    );
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto" style={{ opacity: 0 }}>
      <div className="glass rounded-xl px-2 py-2 w-full max-w-2xl border border-primary/20 shadow-[0_0_40px_hsl(36_90%_55%/_0.08)]">
        <form onSubmit={handleSubmit} className="relative">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Lisboa em setembro, saindo de São Paulo..."
            className="w-full bg-foreground/5 border border-foreground/15 backdrop-blur-md pl-5 pr-14 py-4 sm:py-5 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all duration-300 rounded-lg"
          />
          <button
            type="submit"
            disabled={!value.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-primary text-primary-foreground disabled:opacity-30 hover:bg-primary/85 transition-all duration-200 rounded-lg"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
      <p className="text-muted-foreground text-xs mt-3 text-center tracking-wide">
        Voos reais · Hotéis verificados · Logística precisa
      </p>
    </div>
  );
};

export default ChatHeroInput;
