"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  ArrowRight,
  Glasses,
  Bot,
  User,
  CornerDownLeft,
} from "lucide-react";
import { SafeProduct } from "@/lib/data-guards";
import { formatPrice, formatFrameShape, formatMaterial } from "@/lib/utils";

interface GeminiFrameStylistProps {
  products: SafeProduct[];
  onSelectProduct: (product: SafeProduct) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  productIds?: string[];
  suggestedQuestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  "What frames look best on a round face?",
  "Which lenses are best for long screen time?",
  "What are the best frames for high prescription?",
  "How does nationwide delivery work in Pakistan?",
];

export default function GeminiFrameStylist({
  products,
  onSelectProduct,
  isOpen,
  onClose,
}: GeminiFrameStylistProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "Hello! I am your MY EYES optical assistant. How can I help you today? You can ask me for frame recommendations based on your face shape, lens guidance for prescription needs, or general styling advice.",
      suggestedQuestions: DEFAULT_SUGGESTIONS,
    },
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 150);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const userText = (textToSend || inputQuery).trim();
    if (!userText || isLoading) return;

    // 1. Append user message to state immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userText,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputQuery("");
    setIsLoading(true);

    try {
      // 2. Call backend API route
      const res = await fetch("/api/ai-stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, products }),
      });

      const data = await res.json();

      // 3. Append Gemini's actual reply to state
      if (data && data.reply) {
        setMessages([
          ...newMessages,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.reply,
          },
        ]);
      } else {
        setMessages([
          ...newMessages,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: "I'm here to help you find the right frames and lenses!",
          },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages([
        ...newMessages,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I ran into a connection error. Please try again!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content:
          "Hello! I am your MY EYES optical assistant. How can I help you today? You can ask me for frame recommendations based on your face shape, lens guidance for prescription needs, or general styling advice.",
        suggestedQuestions: DEFAULT_SUGGESTIONS,
      },
    ]);
  };

  const getProductImage = (product: SafeProduct): string => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    if (typeof product.images === "string" && product.images) {
      return product.images;
    }
    return "/placeholder-frame.png";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl h-[90vh] max-h-[700px] bg-white rounded-3xl shadow-2xl border border-amber-200/80 flex flex-col overflow-hidden text-slate-900">
        {/* ============================================================ */}
        {/* HEADER: WHITE & AMBER BRAND THEME                            */}
        {/* ============================================================ */}
        <div className="bg-white border-b border-amber-100 px-5 sm:px-6 py-4 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#F59E0B] shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-tight text-slate-900 uppercase">
                  MY EYES <span className="text-[#F59E0B]">AI ASSISTANT</span>
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Live Optical Guidance & Frame Consultation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetChat}
              title="Reset Chat"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              aria-label="Close Assistant"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CHAT MESSAGES STREAM                                         */}
        {/* ============================================================ */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/60">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            const recommendedProducts = (msg.productIds || [])
              .map((id) => products.find((p) => p.id === id))
              .filter(Boolean) as SafeProduct[];

            return (
              <div
                key={msg.id}
                className={`flex gap-3 items-start ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] space-y-3 ${
                    isUser ? "items-end text-right" : "items-start text-left"
                  }`}
                >
                  {/* Message Bubble */}
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs font-normal ${
                      isUser
                        ? "bg-[#0F172A] text-white rounded-tr-none ml-auto"
                        : "bg-white text-slate-800 border border-amber-100 rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Recommended Frame Cards */}
                  {!isUser && recommendedProducts.length > 0 && (
                    <div className="space-y-2.5 pt-1">
                      <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                        Recommended Frames
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {recommendedProducts.map((prod) => (
                          <div
                            key={prod.id}
                            onClick={() => {
                              onSelectProduct(prod);
                              onClose();
                            }}
                            className="bg-white p-3 rounded-2xl border border-amber-200/80 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 group"
                          >
                            <div className="relative w-16 h-12 bg-slate-50 rounded-xl p-1 shrink-0 overflow-hidden flex items-center justify-center border border-slate-100">
                              <Image
                                src={getProductImage(prod)}
                                alt={prod.name}
                                fill
                                className="object-contain p-0.5 group-hover:scale-105 transition-transform"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-bold text-slate-900 group-hover:text-amber-600 truncate">
                                {prod.name}
                              </h5>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                                <span className="font-extrabold text-[#F59E0B]">
                                  {formatPrice(prod.price)}
                                </span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-500 truncate">
                                  {formatFrameShape(prod.frameShape)}
                                </span>
                              </div>
                            </div>

                            <button className="text-[11px] bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-xl transition-colors shrink-0 shadow-2xs flex items-center gap-1">
                              <span>View</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Question Chips */}
                  {!isUser && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(q)}
                          className="text-[11px] bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-amber-200/70 hover:border-amber-400 px-3 py-1.5 rounded-full transition-all cursor-pointer font-medium shadow-2xs text-left"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3 items-start justify-start">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-2xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-amber-100 p-3.5 rounded-2xl rounded-tl-none shadow-2xs flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ============================================================ */}
        {/* INPUT BAR: WHITE AND AMBER                                  */}
        {/* ============================================================ */}
        <div className="p-3 sm:p-4 bg-white border-t border-amber-100 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything about frames, face shapes, or lenses..."
              className="flex-1 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white focus:outline-none px-4 py-3 rounded-2xl text-xs sm:text-sm text-slate-900 transition-all"
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="w-11 h-11 rounded-2xl bg-[#F59E0B] hover:bg-[#D97706] disabled:bg-slate-200 text-white flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shadow-sm shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
