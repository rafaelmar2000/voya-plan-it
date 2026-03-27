import { Loader2 } from "lucide-react";
import { parseHotelsFromText } from "@/lib/parseHotels";
import HotelSuggestionCard from "@/components/dashboard/HotelSuggestionCard";
import FlightTicketCard from "@/components/dashboard/FlightTicketCard";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  hasFunctionCall?: boolean;
  children?: React.ReactNode;
}

const ChatBubble = ({ role, content, hasFunctionCall, children }: ChatBubbleProps) => {
  const isUser = role === "user";

  const { introText, hotels } = !isUser
    ? parseHotelsFromText(content)
    : { introText: content, hotels: [] };

  const flights = hotels.filter((h) => h.kind === "flight");
  const nonFlights = hotels.filter((h) => h.kind !== "flight");

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
      <div className={`${isUser ? "max-w-[85%] sm:max-w-[70%]" : "max-w-[95%] sm:max-w-[90%]"} ${isUser ? "" : "space-y-4"}`}>
        {introText && (
          <div
            className={
              isUser
                ? "bg-charcoal text-foreground px-4 py-3 rounded-lg rounded-br-sm text-sm leading-relaxed"
                : "text-foreground/90 text-sm leading-relaxed whitespace-pre-line"
            }
          >
            {introText}
          </div>
        )}

        {hasFunctionCall && (
          <div className="mt-3 flex items-center gap-3 bg-[hsl(var(--charcoal))] border border-foreground/10 px-4 py-3 rounded text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Buscando dados em tempo real no Google Flights/Hotels...</span>
          </div>
        )}

        {/* Flight tickets */}
        {flights.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3">
            {flights.map((f, i) => (
              <FlightTicketCard key={`flight-${f.name}-${i}`} flight={f} index={i} />
            ))}
          </div>
        )}

        {/* Hotel / attraction cards */}
        {nonFlights.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nonFlights.map((hotel, i) => (
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
