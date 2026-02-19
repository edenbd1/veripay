import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <Image src="/logo.webp" alt="VeriPay" width={24} height={24} className="rounded-md brightness-200" />
            <span className="text-sm font-semibold">VeriPay</span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center gap-6">
            <Link href="/" className="text-sm text-background/60 transition-colors hover:text-background">Accueil</Link>
            <Link href="/analyser" className="text-sm text-background/60 transition-colors hover:text-background">Analyser</Link>
            <Link href="/documentation" className="text-sm text-background/60 transition-colors hover:text-background">Documentation</Link>
            <Link href="/contact" className="text-sm text-background/60 transition-colors hover:text-background">Contact</Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-background/10 pt-6 text-[11px] text-background/40">
          &copy; {new Date().getFullYear()} VeriPay &mdash; Convention CCNT 66
        </div>
      </div>
    </footer>
  );
}
