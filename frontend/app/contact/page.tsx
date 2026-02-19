"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-foreground/5 dark:bg-foreground/10">
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
                type="text"
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-foreground/30 focus:outline-none"
                placeholder="Votre nom"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-foreground/30 focus:outline-none"
                placeholder="vous@exemple.com"
              />
            </div>

            <div>
              <label htmlFor="subject" className="mb-1.5 block text-xs font-medium text-foreground">
                Sujet
              </label>
              <input
                id="subject"
                type="text"
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-foreground/30 focus:outline-none"
                placeholder="Objet de votre message"
              />
            </div>

            <div>
              <label htmlFor="message" className="mb-1.5 block text-xs font-medium text-foreground">
                Message
              </label>
              <textarea
                id="message"
                required
                rows={5}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-foreground/30 focus:outline-none resize-none"
                placeholder="Votre message..."
              />
            </div>

            <Button type="submit" className="w-full">
              Envoyer le message
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
