import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <Image src="/logo.webp" alt="VeriPay" width={24} height={24} className="rounded-md" />
            <span className="text-sm font-semibold text-foreground">VeriPay</span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center gap-6">
            <Link href="/" className="text-sm text-muted transition-colors hover:text-foreground">Accueil</Link>
            <Link href="/analyser" className="text-sm text-muted transition-colors hover:text-foreground">Analyser</Link>
            <Link href="/documentation" className="text-sm text-muted transition-colors hover:text-foreground">Documentation</Link>
            <Link href="/contact" className="text-sm text-muted transition-colors hover:text-foreground">Contact</Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-[11px] text-muted-foreground">
          &copy; {new Date().getFullYear()} VeriPay &mdash; Convention CCNT 66
        </div>
      </div>
    </footer>
  );
}
