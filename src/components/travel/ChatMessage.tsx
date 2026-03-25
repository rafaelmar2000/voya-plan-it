import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  children?: React.ReactNode;
}

const ChatMessage = ({ role, content, children }: ChatMessageProps) => {
  const isAssistant = role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in",
        isAssistant ? "justify-start" : "justify-end"
      )}
    >
      {isAssistant && (
        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 mt-1">
          <span className="text-xs font-display font-bold text-primary">V</span>
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] space-y-3",
          isAssistant ? "" : "text-right"
        )}
      >
        <div
          className={cn(
            "inline-block rounded-lg px-4 py-3 text-sm leading-relaxed",
            isAssistant
              ? "bg-card border border-border text-foreground"
              : "bg-primary text-primary-foreground"
          )}
        >
          {content}
        </div>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
};

export default ChatMessage;
