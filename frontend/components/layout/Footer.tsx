import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.webp" alt="VeriPay" width={24} height={24} className="rounded-md brightness-200" />
            <span className="text-sm font-semibold">VeriPay</span>
          </div>
          <nav className="flex flex-wrap items-center gap-6">
            <Link href="/" className="text-sm text-white/50 transition-colors hover:text-white">Accueil</Link>
            <Link href="/analyser" className="text-sm text-white/50 transition-colors hover:text-white">Analyser</Link>
            <Link href="/documentation" className="text-sm text-white/50 transition-colors hover:text-white">Documentation</Link>
            <Link href="/contact" className="text-sm text-white/50 transition-colors hover:text-white">Contact</Link>
          </nav>
        </div>
        <div className="mt-8 border-t border-white/10 pt-6 text-[11px] text-white/30">
          &copy; {new Date().getFullYear()} VeriPay &mdash; Convention CCNT 66
        </div>
      </div>
    </footer>
  );
}
