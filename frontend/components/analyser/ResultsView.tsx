"use client";

import { useState } from "react";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { Button } from "@/components/ui/Button";
import { ErrorTypeSummary } from "./ErrorTypeSummary";
import { BulletinList } from "./BulletinList";
import { ChatBot } from "./ChatBot";
import type { ResultatAnalyse } from "@/lib/types";

interface ResultsViewProps {
  result: ResultatAnalyse;
  fileName: string | null;
  totalErreurs: number;
  totalValides: number;
  totalInvalides: number;
  onReset: () => void;
}

export function ResultsView({
  result,
  fileName,
  totalErreurs,
  totalValides,
  totalInvalides,
  onReset,
}: ResultsViewProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatErrorType, setChatErrorType] = useState("");

  const handleExplainError = (errorType: string) => {
    setChatErrorType(errorType);
    setChatOpen(true);
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Resultats de l&apos;analyse
          </h2>
          {fileName && (
            <p className="mt-1 text-xs text-muted">{fileName}</p>
          )}
        </div>
        <Button variant="secondary" onClick={onReset}>
          Nouvelle analyse
        </Button>
      </div>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Bulletins" value={result.nombreBulletins} />
        <SummaryCard label="Pages" value={result.nombrePages} />
        <SummaryCard label="Valides" value={totalValides} color="emerald" />
        <SummaryCard
          label="En erreur"
          value={totalInvalides}
          color={totalInvalides > 0 ? "red" : "emerald"}
        />
      </div>

      {/* Status banner */}
      <div className="mb-6">
        {totalInvalides === 0 ? (
          <StatusBanner
            variant="success"
            title="Aucune erreur de parametrage detectee. Tous les bulletins sont conformes."
          />
        ) : (
          <StatusBanner
            variant="error"
            title={`${totalErreurs} erreur${totalErreurs > 1 ? "s" : ""} de parametrage detectee${totalErreurs > 1 ? "s" : ""} sur ${totalInvalides} bulletin${totalInvalides > 1 ? "s" : ""}.`}
            description="Les erreurs ci-dessous indiquent des parametres 2026 mal configures dans le logiciel de paie."
          />
        )}
      </div>

      {/* Error type summary */}
      <ErrorTypeSummary bulletins={result.bulletins} onExplainError={handleExplainError} />

      {/* Bulletin list */}
      <BulletinList bulletins={result.bulletins} />

      {/* Chat drawer */}
      <ChatBot
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        errorType={chatErrorType}
      />
    </div>
  );
}
