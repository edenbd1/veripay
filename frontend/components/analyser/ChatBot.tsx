"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/cn";
import { API_URL, ERROR_INFO } from "@/lib/constants";
import type { ChatMessage } from "@/lib/types";

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

async function streamChat(
  errorType: string,
  message: string,
  history: ChatMessage[],
  bulletinContext: ChatBotProps["bulletinContext"],
  signal: AbortSignal,
  onChunk: (text: string) => void,
): Promise<void> {
  const res = await fetch(`${API_URL}/bulletins/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ errorType, message, history, bulletinContext }),
    signal,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let errMsg = `Erreur ${res.status}`;
    try {
      const parsed = JSON.parse(body);
      if (parsed.erreur) errMsg = parsed.erreur;
    } catch { /* ignore */ }
    throw new Error(errMsg);
  }

  // Try streaming with ReadableStream reader
  const reader = res.body?.getReader();
  if (!reader) {
    // Fallback: read as text
    const text = await res.text();
    const lines = text.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      const payload = trimmed.slice(6);
      if (payload === "[DONE]") continue;
      try {
        const parsed = JSON.parse(payload);
        if (parsed.content) onChunk(parsed.content);
      } catch { /* ignore */ }
    }
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

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
        const parsed = JSON.parse(payload);
        if (parsed.content) onChunk(parsed.content);
      } catch { /* ignore */ }
    }
  }

  // Process remaining buffer
  if (buffer.trim()) {
    const trimmed = buffer.trim();
    if (trimmed.startsWith("data: ")) {
      const payload = trimmed.slice(6);
      if (payload !== "[DONE]") {
        try {
          const parsed = JSON.parse(payload);
          if (parsed.content) onChunk(parsed.content);
        } catch { /* ignore */ }
      }
    }
  }
}

export function ChatBot({ open, onClose, errorType, bulletinContext }: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastErrorTypeRef = useRef<string | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-explain when opening with a new error type
  useEffect(() => {
    if (!open || !errorType) return;
    if (lastErrorTypeRef.current === errorType) return;
    lastErrorTypeRef.current = errorType;

    const info = ERROR_INFO[errorType];
    const label = info?.label ?? errorType;
    const autoMessage = `Explique-moi l'erreur ${errorType} (${label}) en detail : causes possibles, impact sur le bulletin, et comment la corriger.`;

    const userMsg: ChatMessage = { role: "user", content: autoMessage };
    setMessages([userMsg]);
    setError(null);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let fullContent = "";

    setMessages([userMsg, { role: "assistant", content: "" }]);

    streamChat(
      errorType,
      autoMessage,
      [],
      bulletinContext,
      controller.signal,
      (chunk) => {
        fullContent += chunk;
        const captured = fullContent;
        setMessages([userMsg, { role: "assistant", content: captured }]);
      },
    )
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const errMsg = err instanceof Error ? err.message : "Erreur de connexion";
        setError(errMsg);
        if (!fullContent) {
          setMessages([userMsg, { role: "assistant", content: `Erreur : ${errMsg}` }]);
        }
      })
      .finally(() => {
        setStreaming(false);
      });

    return () => {
      controller.abort();
    };
  }, [open, errorType, bulletinContext]);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      lastErrorTypeRef.current = null;
      setMessages([]);
      setInput("");
      setError(null);
      setStreaming(false);
      abortRef.current?.abort();
    }
  }, [open]);

  // Focus input when ready
  useEffect(() => {
    if (open && !streaming) {
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [open, streaming]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || streaming) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const history = [...messages];
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setError(null);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let fullContent = "";

    setMessages([...newMessages, { role: "assistant", content: "" }]);

    try {
      await streamChat(
        errorType,
        trimmed,
        history,
        bulletinContext,
        controller.signal,
        (chunk) => {
          fullContent += chunk;
          const captured = fullContent;
          setMessages([...newMessages, { role: "assistant", content: captured }]);
        },
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const errMsg = err instanceof Error ? err.message : "Erreur de connexion";
      setError(errMsg);
      if (!fullContent) {
        setMessages([...newMessages, { role: "assistant", content: `Erreur : ${errMsg}` }]);
      }
    } finally {
      setStreaming(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-border bg-background shadow-2xl shadow-black/10 transition-transform duration-300 ease-out",
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
            className="rounded-full p-2 text-muted transition-colors hover:bg-black/5 hover:text-foreground"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="border-b border-border bg-red-50 px-6 py-3">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

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
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-foreground text-background"
                      : "bg-surface border border-border text-foreground",
                  )}
                >
                  {msg.content || (
                    <span className="inline-flex items-center gap-1.5 text-muted">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/30" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/30" style={{ animationDelay: "0.2s" }} />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/30" style={{ animationDelay: "0.4s" }} />
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
              className="flex-1 rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-foreground/20 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="rounded-full bg-foreground px-4 py-2.5 text-background transition-all hover:bg-foreground/90 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
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
