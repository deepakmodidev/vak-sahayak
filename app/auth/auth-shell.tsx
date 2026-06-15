import Link from 'next/link';

/**
 * On-brand wrapper for the auth pages: subtle Sarvam gradient, centered white
 * rounded card, Vak Sahayak logo + serif heading.
 */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden bg-transparent px-6 py-16">
      <div className="pointer-events-none absolute top-0 left-0 z-0 w-full overflow-hidden opacity-50">
        <img
          src="/sarvam/hero-gradient.svg"
          alt=""
          className="h-auto w-full scale-150 -scale-y-100 object-cover"
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <img src="/vak-sahayak.png" alt="Vak Sahayak" className="h-9 w-auto" />
          <span className="font-serif text-2xl font-bold tracking-tight">Vak Sahayak</span>
        </Link>

        <div className="border-border rounded-3xl border bg-white p-8 shadow-sm sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="font-serif text-3xl leading-tight tracking-tight">{title}</h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
