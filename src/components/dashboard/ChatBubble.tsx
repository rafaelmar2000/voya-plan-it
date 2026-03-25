import { Loader2 } from "lucide-react";
import { parseHotelsFromText } from "@/lib/parseHotels";
import HotelSuggestionCard from "@/components/dashboard/HotelSuggestionCard";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  hasFunctionCall?: boolean;
  children?: React.ReactNode;
}

const ChatBubble = ({ role, content, hasFunctionCall, children }: ChatBubbleProps) => {
  const isUser = role === "user";
  const hotels = !isUser ? parseHotelsFromText(content) : [];
  const hasHotels = hotels.length > 0;

  // Strip hotel block text if we're rendering cards instead
  const displayText = hasHotels
    ? content.split(/\n\d+[\.\)]\s/)[0].trim()
    : content;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
      <div className={`max-w-[85%] sm:max-w-[90%] ${isUser ? "" : "space-y-4"}`}>
        {/* Text portion */}
        {displayText && (
          <div
            className={
              isUser
                ? "bg-charcoal text-foreground px-4 py-3 rounded-lg rounded-br-sm text-sm leading-relaxed"
                : "text-foreground/90 text-sm leading-relaxed whitespace-pre-line"
            }
          >
            {displayText}
          </div>
        )}

        {/* Function call indicator */}
        {hasFunctionCall && (
          <div className="mt-3 flex items-center gap-3 bg-[hsl(var(--charcoal))] border border-foreground/10 px-4 py-3 rounded text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Buscando dados em tempo real no Google Flights/Hotels...</span>
          </div>
        )}

        {/* Hotel cards grid */}
        {hasHotels && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hotels.map((hotel, i) => (
              <HotelSuggestionCard key={`${hotel.name}-${i}`} hotel={hotel} index={i} />
            ))}
          </div>
        )}

        {children && <div className="mt-3 space-y-3">{children}</div>}
      </div>
    </div>
  );
};

export default ChatBubble;
