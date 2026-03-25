interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  children?: React.ReactNode;
}

const ChatBubble = ({ role, content, children }: ChatBubbleProps) => {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
      <div className={`max-w-[85%] sm:max-w-[70%] ${isUser ? "" : "space-y-4"}`}>
        {/* Text bubble */}
        <div
          className={
            isUser
              ? "bg-charcoal text-foreground px-4 py-3 rounded-lg rounded-br-sm text-sm leading-relaxed"
              : "text-foreground/90 text-sm leading-relaxed"
          }
        >
          {content}
        </div>

        {/* Attached cards */}
        {children && <div className="mt-3 space-y-3">{children}</div>}
      </div>
    </div>
  );
};

export default ChatBubble;
