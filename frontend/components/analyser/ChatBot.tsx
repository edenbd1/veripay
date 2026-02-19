"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import { API_URL, ERROR_INFO } from "@/lib/constants";
import type { ChatMessage, ChatRequest } from "@/lib/types";

interface ChatBotProps {
  open: boolean;
  onClose: () => void;
  errorType: string;
  bulletinContext?: {
    salarie?: string;
    periode?: string;
    brut?: number;
  };
}

export function ChatBot({ open, onClose, errorType, bulletinContext }: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const initRef = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(async (
    userMessage: string,
    history: ChatMessage[],
  ) => {
    setStreaming(true);
    abortRef.current = new AbortController();

    const body: ChatRequest = {
      errorType,
      message: userMessage,
      history,
      bulletinContext,
    };

    try {
      const res = await fetch(`${API_URL}/bulletins/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ erreur: "Erreur inconnue" }));
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Erreur : ${err.erreur || res.statusText}` },
        ]);
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const payload = trimmed.slice(6);
          if (payload === "[DONE]") continue;

          try {
            const parsed = JSON.parse(payload) as { content?: string };
            if (parsed.content) {
              fullContent += parsed.content;
              const captured = fullContent;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: captured };
                return updated;
              });
            }
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Erreur de connexion au serveur." },
      ]);
    } finally {
      setStreaming(false);
    }
  }, [errorType, bulletinContext]);

  useEffect(() => {
    if (open && errorType && initRef.current !== errorType) {
      initRef.current = errorType;
      const info = ERROR_INFO[errorType];
      const label = info?.label ?? errorType;
      const autoMessage = `Explique-moi l'erreur ${errorType} (${label}) en detail : causes possibles, impact sur le bulletin, et comment la corriger.`;
      setMessages([{ role: "user", content: autoMessage }]);
      sendMessage(autoMessage, []);
    }
  }, [open, errorType, sendMessage]);

  useEffect(() => {
    if (!open) {
      initRef.current = null;
      setMessages([]);
      setInput("");
      abortRef.current?.abort();
    }
  }, [open]);

  useEffect(() => {
    if (open && !streaming) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, streaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || streaming) return;

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(newMessages);
    setInput("");
    sendMessage(trimmed, messages);
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-border bg-background shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Assistant IA</h3>
            <p className="mt-0.5 text-[11px] text-muted">
              Erreur {errorType} {ERROR_INFO[errorType] ? `\u2014 ${ERROR_INFO[errorType].label}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-foreground text-background"
                      : "bg-surface border border-border text-foreground",
                  )}
                >
                  {msg.content || (
                    <span className="inline-flex items-center gap-1.5 text-muted">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/40" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/40" style={{ animationDelay: "0.2s" }} />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/40" style={{ animationDelay: "0.4s" }} />
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-border px-6 py-5">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez une question de suivi..."
              disabled={streaming}
              className="flex-1 rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-foreground/30 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="rounded-full bg-foreground px-4 py-2.5 text-background transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
