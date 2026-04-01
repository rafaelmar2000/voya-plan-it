import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  children?: React.ReactNode;
  isTyping?: boolean;
}

const ChatMessage = ({ role, content, children, isTyping }: ChatMessageProps) => {
  const isAssistant = role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in",
        isAssistant ? "justify-start" : "justify-end"
      )}
    >
      {isAssistant && (
        <div className="w-8 h-8 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 mt-1">
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
          {isTyping ? (
            <div className="flex gap-1 items-center py-1">
              <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            content
          )}
        </div>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
};

export default ChatMessage;
