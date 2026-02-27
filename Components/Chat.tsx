"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Slide, ToastContainer, toast } from "react-toastify";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useChat } from "@ai-sdk/react";
import Input from "./Input";
import TypingIndicator from "./TypingIndicator";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  Terminal,
  Sparkles,
  Newspaper,
  CloudSun,
  BookOpen,
  Loader2,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Search,
  Wrench,
} from "lucide-react";


// --- Tool Metadata ---
const TOOL_META: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; description: string }
> = {
  news: {
    label: "News Search",
    icon: <Newspaper size={18} />,
    color: "text-blue-400",
    description: "Searching for news articles...",
  },
  weather: {
    label: "Weather",
    icon: <CloudSun size={18} />,
    color: "text-amber-400",
    description: "Fetching weather data...",
  },
  islamicGPT: {
    label: "Islamic Knowledge",
    icon: <BookOpen size={18} />,
    color: "text-emerald-400",
    description: "Searching Hadith & Tafseer database...",
  },
};

// --- Tool Call Indicator Component ---
const ToolCallIndicator = React.memo(
  ({
    toolName,
    state,
    args,
  }: {
    toolName: string;
    state: string;
    args?: any;
  }) => {
    const meta = TOOL_META[toolName] || {
      label: toolName,
      icon: <Wrench size={18} />,
      color: "text-gold",
      description: "Processing...",
    };

    const isLoading = state === "call" || state === "partial-call";
    const isComplete = state === "result";

    // Build a context string from the tool arguments
    const contextString = React.useMemo(() => {
      if (!args) return "";
      if (toolName === "news" && args.query) return `"${args.query}"`;
      if (toolName === "weather" && args.city) return `for ${args.city}`;
      if (toolName === "islamicGPT" && args.query)
        return `"${args.query}" in ${args.collectionName || "Hadith"}`;
      return "";
    }, [args, toolName]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className={`
          flex items-center gap-3 px-4 py-3 my-3 rounded-xl border backdrop-blur-sm
          ${isLoading
            ? "bg-white/5 border-gold/20 shadow-lg shadow-gold/5"
            : "bg-white/[0.02] border-white/10"
          }
        `}
      >
        {/* Icon */}
        <div
          className={`
          flex items-center justify-center w-9 h-9 rounded-lg
          ${isLoading ? "bg-white/10 animate-pulse" : "bg-white/5"}
        `}
        >
          <span className={meta.color}>{meta.icon}</span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground/90 font-sans">
              {meta.label}
            </span>
            {isLoading && (
              <Loader2
                size={14}
                className="text-gold animate-spin flex-shrink-0"
              />
            )}
            {isComplete && (
              <CheckCircle2
                size={14}
                className="text-emerald-400 flex-shrink-0"
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate font-sans">
            {isLoading
              ? `${meta.description} ${contextString}`
              : `Completed ${contextString}`}
          </p>
        </div>

        {/* Status Badge */}
        <div
          className={`
          text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-full
          ${isLoading
              ? "bg-gold/10 text-gold border border-gold/20"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            }
        `}
        >
          {isLoading ? "Running" : "Done"}
        </div>
      </motion.div>
    );
  }
);
ToolCallIndicator.displayName = "ToolCallIndicator";

// --- Error Display Component ---
const ErrorMessage = React.memo(
  ({
    error,
    onRetry,
  }: {
    error: Error | string;
    onRetry?: () => void;
  }) => {
    const errorMessage =
      typeof error === "string" ? error : error?.message || "An unknown error occurred.";

    // Classify the error for user-friendly messages
    const getUserFriendlyMessage = (msg: string): string => {
      if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed to fetch")) {
        return "Network error. Please check your internet connection and try again.";
      }
      if (msg.includes("rate limit") || msg.includes("429")) {
        return "Too many requests. Please wait a moment and try again.";
      }
      if (msg.includes("timeout") || msg.includes("TIMEOUT")) {
        return "The request timed out. Please try again.";
      }
      if (msg.includes("API key") || msg.includes("401") || msg.includes("403")) {
        return "Authentication error. Please contact support.";
      }
      if (msg.includes("500") || msg.includes("Internal Server")) {
        return "Server error. Please try again in a few moments.";
      }
      return "Something went wrong. Please try again.";
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 px-5 py-4 my-4 rounded-xl bg-red-500/5 border border-red-500/20 backdrop-blur-sm"
      >
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-500/10 flex-shrink-0 mt-0.5">
          <AlertTriangle size={18} className="text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-400 font-sans mb-1">
            Error
          </p>
          <p className="text-xs text-red-300/70 font-sans">
            {getUserFriendlyMessage(errorMessage)}
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium 
                       text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20
                       rounded-lg border border-red-500/20 transition-all group flex-shrink-0"
          >
            <RefreshCw
              size={12}
              className="group-hover:rotate-180 transition-transform duration-500"
            />
            Retry
          </button>
        )}
      </motion.div>
    );
  }
);
ErrorMessage.displayName = "ErrorMessage";

// --- Code Block ---
const CodeBlock = React.memo(({ language, code, ...props }: any) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-8 rounded-xl overflow-hidden border border-gold/20 shadow-2xl bg-[#0d1616]">
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-gold/10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-gold/60" />
          <span className="text-xs font-medium text-gold/60 uppercase tracking-widest font-sans">
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-gold transition-colors group"
        >
          {copied ? (
            <>
              <Check size={14} className="text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy size={14} className="group-hover:text-gold" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          style={vscDarkPlus as { [key: string]: React.CSSProperties }}
          language={language}
          wrapLines={true}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: "1.5rem",
            background: "transparent",
            fontSize: "0.875rem",
            lineHeight: "1.7",
            fontFamily: '"Fira Code", monospace',
          }}
          {...props}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
});
CodeBlock.displayName = "CodeBlock";

// --- Markdown Components ---
const markdownComponents = {
  h1: ({ children }: any) => (
    <h1 className="text-3xl font-serif text-gold mt-8 mb-4 tracking-tight border-b border-gold/20 pb-2">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-2xl font-serif text-gold/90 mt-6 mb-3 tracking-tight">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-xl font-serif text-gold/80 mt-5 mb-2">{children}</h3>
  ),
  p: ({ children }: any) => (
    <p className="mb-4 text-foreground/90 leading-relaxed font-sans last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children }: any) => (
    <ul className="list-disc pl-6 mb-4 space-y-2 text-foreground/90 marker:text-gold">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal pl-6 mb-4 space-y-2 text-foreground/90 marker:text-gold">
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="pl-1 leading-relaxed">{children}</li>
  ),
  strong: ({ children }: any) => (
    <strong className="font-semibold text-gold">{children}</strong>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-gold underline underline-offset-4 decoration-gold/40 hover:decoration-gold transition-all"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-gold/40 pl-6 py-2 my-6 text-muted-foreground italic bg-gold/5 rounded-r-lg font-serif">
      {children}
    </blockquote>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-8 rounded-lg border border-gold/20 shadow-lg">
      <table className="w-full text-left border-collapse text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-gold/10 text-gold uppercase tracking-wider font-medium font-serif">
      {children}
    </thead>
  ),
  tbody: ({ children }: any) => (
    <tbody className="text-foreground/80 divide-y divide-gold/10">
      {children}
    </tbody>
  ),
  tr: ({ children }: any) => (
    <tr className="hover:bg-gold/5 transition-colors">{children}</tr>
  ),
  th: ({ children }: any) => (
    <th className="px-6 py-4 font-semibold">{children}</th>
  ),
  td: ({ children }: any) => <td className="px-6 py-4">{children}</td>,
  code({ node, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || "");
    const inline = (props as any).inline;
    const codeString = String(children).replace(/\n$/, "");

    return !inline && match ? (
      <CodeBlock language={match[1]} code={codeString} {...props} />
    ) : (
      <code
        className="bg-gold/10 text-gold px-1.5 py-0.5 rounded text-sm font-mono border border-gold/20"
        {...props}
      >
        {children}
      </code>
    );
  },
};

// --- Markdown Renderer ---
const MarkdownWithHighlight = React.memo(
  ({ markdown }: { markdown: string }) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={markdownComponents as any}
    >
      {markdown}
    </ReactMarkdown>
  ),
  (prev, next) => prev.markdown === next.markdown
);
MarkdownWithHighlight.displayName = "MarkdownWithHighlight";

// --- Message Item (now renders tool indicators inline) ---
const MessageItem = React.memo(({ message }: { message: any }) => {
  const isAI = message.role === "assistant";

  // Separate text parts from tool-invocation parts
  const textContent =
    message.content ||
    message.parts
      ?.filter((part: any) => part.type === "text")
      .map((part: any) => part.text)
      .join("") ||
    "";

  const toolParts =
    message.parts?.filter((part: any) => part.type === "tool-invocation") || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex items-start gap-4 ${isAI ? "" : "justify-end"}`}
    >
      <div
        className={`
          relative px-2 py-2 max-w-[85%] lg:max-w-[75%] shadow-xl backdrop-blur-md border
          ${isAI ? "transparent" : "transparent"}
        `}
      >
        {/* Tool call indicators (shown inline in assistant messages) */}
        {isAI && toolParts.length > 0 && (
          <div className="mb-3">
            <AnimatePresence mode="sync">
              {toolParts.map((part: any, idx: number) => (
                <ToolCallIndicator
                  key={part.toolInvocation?.toolCallId || idx}
                  toolName={part.toolInvocation?.toolName || "unknown"}
                  state={part.toolInvocation?.state || "call"}
                  args={part.toolInvocation?.args}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Text content */}
        {textContent && (
          <div className="text-sm md:text-base leading-7 font-sans">
            <MarkdownWithHighlight markdown={textContent} />
          </div>
        )}
      </div>
    </motion.div>
  );
});
MessageItem.displayName = "MessageItem";

// --- Streaming Tool Indicator (shown below messages while streaming) ---
const StreamingToolIndicator = React.memo(
  ({ messages }: { messages: any[] }) => {
    // Find any in-progress tool calls in the latest assistant message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant") return null;

    const activeToolCalls =
      lastMessage.parts?.filter(
        (part: any) =>
          part.type === "tool-invocation" &&
          (part.toolInvocation?.state === "call" ||
            part.toolInvocation?.state === "partial-call")
      ) || [];

    if (activeToolCalls.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="pl-2"
      >
        {activeToolCalls.map((part: any, idx: number) => {
          const meta = TOOL_META[part.toolInvocation?.toolName] || {
            label: part.toolInvocation?.toolName || "Tool",
            icon: <Search size={16} />,
            color: "text-gold",
            description: "Processing...",
          };

          return (
            <motion.div
              key={part.toolInvocation?.toolCallId || idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 py-2"
            >
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-gold/15">
                <Loader2 size={16} className="text-gold animate-spin" />
                <span className={`${meta.color}`}>{meta.icon}</span>
                <span className="text-sm text-foreground/70 font-sans">
                  Using <span className="text-gold font-medium">{meta.label}</span>
                  {part.toolInvocation?.args?.query && (
                    <span className="text-muted-foreground">
                      {" "}
                      — "{part.toolInvocation.args.query}"
                    </span>
                  )}
                  {part.toolInvocation?.args?.city && (
                    <span className="text-muted-foreground">
                      {" "}
                      — {part.toolInvocation.args.city}
                    </span>
                  )}
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    );
  }
);
StreamingToolIndicator.displayName = "StreamingToolIndicator";

// --- Main Chat Component ---

export default function Chat() {
  const [isTyping, setIsTyping] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string>("");

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    error,
    stop,
  } = useChat({
    onFinish: () => {
      setIsTyping(false);
    },
    onError: (err) => {
      setIsTyping(false);

      // Classify and show appropriate toast
      //     const msg = err?.message || "Unknown error";
      //     if (msg.includes("fetch") || msg.includes("network")) {
      //       toast.error("Network error. Please check your connection.", {
      //         icon: "🌐",
      //       });
      //     } else if (msg.includes("rate limit") || msg.includes("429")) {
      //       toast.warn("Rate limited. Please wait a moment before retrying.", {
      //         icon: "⏳",
      //       });
      //     } else if (msg.includes("timeout")) {
      //       toast.warn("Request timed out. Please try again.", { icon: "⏱️" });
      //     } else {
      //       toast.error("Something went wrong. Please try again.", { icon: "⚠️" });
      //     }

      //     console.error("Chat error:", err);
    },
  });

  // Sync typing state
  useEffect(() => {
    setIsTyping(status === "submitted" || status === "streaming");
  }, [status]);

  const conversations = [
    { id: "kClYPWznce3FwMH6", title: "Current Session" },
  ];
  const [selectedConversation, setSelectedConversation] =
    useState("kClYPWznce3FwMH6");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        toast.warn("Please enter a message.");
        return;
      }
      setLastUserMessage(text);
      try {
        await sendMessage({
          role: "user",
          parts: [{ type: "text", text }],
        });
      } catch (err: any) {

        toast.error("Failed to send message. Please try again.");
      }
    },
    [sendMessage]
  );

  // const handleRetry = useCallback(() => {
  //   try {
  //     reload();
  //   } catch (err) {
  //     console.error("Retry error:", err);
  //     toast.error("Failed to retry. Please try again.");
  //   }
  // }, [reload]);

  function handleNewConversation() {
    setMessages([]);
    setLastUserMessage("");
  }

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  // Check if any tool is currently being called
  const hasActiveToolCall = React.useMemo(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return false;
    return lastMsg.parts?.some(
      (part: any) =>
        part.type === "tool-invocation" &&
        (part.toolInvocation?.state === "call" ||
          part.toolInvocation?.state === "partial-call")
    );
  }, [messages]);

  return (
    <div className="flex h-full relative overflow-hidden bg-background">

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 z-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-8 lg:px-12 scroll-smooth">
          <div className="mx-auto max-w-4xl space-y-10">
            {/* Empty State */}
            {messages.length === 0 && !error && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center py-20"
              >
                <div className="inline-block p-8 rounded-full mb-8 relative">
                  <div className="absolute inset-0 bg-gold/5 blur-2xl rounded-full animate-pulse" />
                  <div className="relative glass p-6 rounded-full border border-gold/20 shadow-2xl">
                    <Sparkles className="w-12 h-12 text-gold opacity-90" />
                  </div>
                </div>
                <h2 className="text-4xl md:text-5xl font-serif font-medium text-gold mb-6 tracking-tight">
                  Welcome to IslamicGPT
                </h2>
                <p className="text-lg text-muted-foreground font-light max-w-lg mx-auto leading-relaxed">
                  Ask anything about Islam, Quran, Hadith, or Islamic history
                  and get instant answers powered by AI. Your personal Islamic
                  scholar, available 24/7.
                </p>
              </motion.div>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))}

            {/* Error State */}
            {/* <AnimatePresence>
              {error && status === "error" && (
                <ErrorMessage error={error} onRetry={handleRetry} />
              )}
            </AnimatePresence> */}

            {/* Streaming Tool Indicator (while streaming, before text arrives) */}
            <AnimatePresence>
              {(status === "streaming" || status === "submitted") &&
                hasActiveToolCall && (
                  <StreamingToolIndicator messages={messages} />
                )}
            </AnimatePresence>

            {/* Typing Indicator (shown when waiting for initial response) */}
            <AnimatePresence>
              {status === "submitted" && !hasActiveToolCall && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="pl-2"
                >
                  <TypingIndicator />
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={scrollRef} className="h-4" />
          </div>
        </div>

        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar
          newestOnTop={false}
          closeOnClick={false}
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          transition={Slide}
        />

        {/* Input Area */}
        <div className="relative z-10 bg-gradient-to-t from-background via-background/90 to-transparent pt-6 mb-2 bottom-0">
          <Input
            onSend={handleSend}
            isTyping={isTyping}
            stop={stop}
            placeholder="Type your message..."
          />
        </div>
      </div>
    </div>
  );
}