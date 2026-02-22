"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { Slide, ToastContainer, toast } from "react-toastify";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useChat } from "@ai-sdk/react";
import Sidebar from "./Sidebar";
import Input from "./Input";
import TypingIndicator from "./TypingIndicator";
import { motion } from "framer-motion";
import { Copy, Check, Terminal, Sparkles } from "lucide-react";

type ChatProps = {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
};

// --- Sub-components for Markdown & Syntax Highlighting ---

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

// Defined outside to prevent re-creation on every render
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

const MarkdownWithHighlight = React.memo(
  ({ markdown }: { markdown: string }) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents as any}
      >
        {markdown}
      </ReactMarkdown>
    );
  },
  (prev, next) => prev.markdown === next.markdown
);

const MessageItem = React.memo(({ message }: { message: any }) => {
  const isAI = message.role === "assistant";
  // Extract text content safely
  const content =
    message.content ||
    message.parts
      ?.map((part: any) => (part.type === "text" ? part.text : ""))
      .join("") ||
    "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex items-start gap-4 ${isAI ? "" : "justify-end"}`}
    >
      {/* {isAI && (
        <div className="w-10 h-10 glass rounded-full flex items-center justify-center text-xs font-bold text-gold border border-gold/30 shrink-0 font-serif shadow-lg mt-1">
          AI
        </div>
      )} */}

      <div
        className={`
        relative px-2 py-2 max-w-[85%] lg:max-w-[75%] shadow-xl backdrop-blur-md border
        ${
          isAI
            ? "transparent"
            : "transparent"
        }
      `}
      >
        <div className="text-sm md:text-base leading-7 font-sans">
          <MarkdownWithHighlight markdown={content} />
        </div>
      </div>
    </motion.div>
  );
});

// --- Main Chat Component ---

export default function Chat({ isSidebarOpen, onToggleSidebar }: ChatProps) {
  const [isTyping, setIsTyping] = useState(false);

  const { messages, sendMessage, setMessages, status, error, stop } = useChat({
    onFinish: (messages) => {
      setIsTyping(false);
    },
    onError: (error) => {
      if (error) {
        const notify = () => toast.warn("There is some error occured!");
        notify();
      }
      setIsTyping(false);
    },
  });

  // Sync typing state with loading state
  useEffect(() => {
    setIsTyping(status === "submitted");
  }, [status]);

  // console.log("id", id);
  const conversations = [{ id: "kClYPWznce3FwMH6", title: "Current Session" }];
  const [selectedConversation, setSelectedConversation] =
    useState("kClYPWznce3FwMH6");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  async function handleSend(text: string) {
    // setIsTyping(true); // Handled by effect now
    await sendMessage({
      role: "user",
      parts: [{ type: "text", text }],
    });
  }

  function handleNewConversation() {
    setMessages([]);
  }

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-full relative overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        conversations={conversations}
        selectedId={selectedConversation}
        onSelectConversation={setSelectedConversation}
        onNewConversation={handleNewConversation}
        onClose={onToggleSidebar}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 z-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-8 lg:px-12 scroll-smooth">
          <div className="mx-auto max-w-4xl space-y-10">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center py-20"
              >
                <div className="inline-block p-8 rounded-full mb-8 relative">
                  <div className="absolute inset-0 bg-gold/5 blur-2xl rounded-full animate-pulse"></div>
                  <div className="relative glass p-6 rounded-full border border-gold/20 shadow-2xl">
                    <Sparkles className="w-12 h-12 text-gold opacity-90" />
                  </div>
                </div>
                <h2 className="text-4xl md:text-5xl font-serif font-medium text-gold mb-6 tracking-tight">
                  Welcome to islamicGPT
                </h2>
                <p className="text-lg text-muted-foreground font-light max-w-lg mx-auto leading-relaxed">
                  Ask anything about Islam, Quran, Hadith, or Islamic history and get instant answers powered by AI. Your personal Islamic scholar, available 24/7.
                </p>
              </motion.div>
            )}
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))}
            {error && (
               <MessageItem message={{role: "assistant", content: error.message }} />
            )}
            {status === "error" && (
               <MessageItem message={{role: "assistant", content: "we can't fulfill your request please try again" }} />
            )}

            {/* Typing Indicator */}
            {status === "submitted" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="pl-2"
              >
                <TypingIndicator />
              </motion.div>
            )}


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
          <Input onSend={handleSend} isTyping={isTyping} stop={stop} placeholder="Type your message..." />
        </div>
      </div>
    </div>
  );
}
