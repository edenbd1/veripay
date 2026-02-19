import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <Image src="/logo.webp" alt="VeriPay" width={24} height={24} className="rounded-md" />
              <span className="text-sm font-semibold">VeriPay</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Vérification automatique de bulletins de paie sous Convention CCNT 66.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Navigation
            </p>
            <ul className="space-y-2">
              <li><Link href="/" className="text-sm text-muted transition-colors hover:text-foreground">Accueil</Link></li>
              <li><Link href="/analyser" className="text-sm text-muted transition-colors hover:text-foreground">Analyser</Link></li>
              <li><Link href="/documentation" className="text-sm text-muted transition-colors hover:text-foreground">Documentation</Link></li>
              <li><Link href="/contact" className="text-sm text-muted transition-colors hover:text-foreground">Contact</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ressources
            </p>
            <ul className="space-y-2">
              <li><Link href="/documentation#api" className="text-sm text-muted transition-colors hover:text-foreground">API</Link></li>
              <li><Link href="/documentation#erreurs" className="text-sm text-muted transition-colors hover:text-foreground">Erreurs détectées</Link></li>
              <li><Link href="/documentation#formats" className="text-sm text-muted transition-colors hover:text-foreground">Formats supportés</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-[11px] text-muted-foreground">
          &copy; {new Date().getFullYear()} VeriPay &middot; Convention CCNT 66
        </div>
      </div>
    </footer>
  );
}
