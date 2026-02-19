"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { API_URL } from "@/lib/constants";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    const form = e.currentTarget;
    const data = {
      nom: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      sujet: (form.elements.namedItem("subject") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.erreur || `Erreur ${res.status}`);
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="animate-fade-in-up mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Contact</h1>
        <p className="mt-2 text-sm text-muted">
          Une question ou un retour ? N&apos;hesitez pas a nous ecrire.
        </p>
      </div>

      {submitted ? (
        <Card className="animate-fade-in-up text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-black/5">
            <svg className="h-6 w-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-foreground">Message envoye</h2>
          <p className="mt-2 text-sm text-muted">
            Merci pour votre message. Nous reviendrons vers vous rapidement.
          </p>
          <Button
            variant="secondary"
            className="mt-6"
            onClick={() => setSubmitted(false)}
          >
            Envoyer un autre message
          </Button>
        </Card>
      ) : (
        <Card className="animate-fade-in-up">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-foreground">
                Nom
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-foreground/20 focus:outline-none"
                placeholder="Votre nom"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-foreground/20 focus:outline-none"
                placeholder="vous@exemple.com"
              />
            </div>

            <div>
              <label htmlFor="subject" className="mb-1.5 block text-xs font-medium text-foreground">
                Sujet
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-foreground/20 focus:outline-none"
                placeholder="Objet de votre message"
              />
            </div>

            <div>
              <label htmlFor="message" className="mb-1.5 block text-xs font-medium text-foreground">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-foreground/20 focus:outline-none resize-none"
                placeholder="Votre message..."
              />
            </div>

            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}

            <Button type="submit" disabled={sending} className="w-full">
              {sending ? "Envoi en cours..." : "Envoyer le message"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
